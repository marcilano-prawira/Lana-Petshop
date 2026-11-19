// Tes alur profil & ganti password. Tidak membutuhkan PostgreSQL: repository diganti data tiruan di memori,
// sedangkan Express, rute, middleware, controller, service, dan bcrypt/JWT yang dipakai adalah kode asli.
// Jalankan:  node --test test/auth-password.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

process.env.JWT_SECRET = 'rahasia-untuk-tes';
process.env.JWT_EXPIRES_IN = '1h';

const { default: db } = await import('../src/config/database.js');
db.transaction = async (cb) => cb({});
db.query = async () => { throw new Error('query langsung ke database tidak boleh terjadi di tes'); };

const { auth, authController } = await import('../src/container.js');
const { default: app } = await import('../src/app.js');
const { default: PembatasPercobaan } = await import('../src/utils/PembatasPercobaan.js');
const { default: Profil } = await import('../src/models/Profil.js');

// ---------- data tiruan ----------
const users = new Map();
const dicabut = new Set();
const jejak = { alamat: [] };
const tambahUser = (id, username, password, role = 'CUSTOMER') =>
  users.set(id, { id_user: id, username, password: bcrypt.hashSync(password, 4), role, nama: username.toUpperCase(),
                  password_diubah_at: null, foto_profil: null, alamat: null });
const cari = (id) => users.get(id);

const userRepo = {
  findById: async (id) => { const u = cari(id); return u && { id_user: u.id_user, username: u.username, role: u.role, password_diubah_at: u.password_diubah_at }; },
  findByUsername: async (nama) => { const u = [...users.values()].find((x) => x.username === nama); return u ?? null; },
  findByIdDenganPassword: async (id) => { const u = cari(id); return u && { id_user: u.id_user, username: u.username, password: u.password, role: u.role }; },
  findProfil: async (id) => { const u = cari(id); return u && { id_user: u.id_user, username: u.username, role: u.role, nama: u.nama, alamat: u.alamat, foto_profil: u.foto_profil }; },
  updatePassword: async (id, hash, waktu) => { const u = cari(id); u.password = hash; u.password_diubah_at = waktu; },
  updateUsername: async (id, nama) => { cari(id).username = nama; },
  updateFoto: async (id, foto) => { cari(id).foto_profil = foto; },
};
const tokenRepo = {
  cabut: async ({ jti }) => { dicabut.add(jti); },
  sudahDicabut: async (jti) => dicabut.has(jti),
  bersihkanKedaluwarsa: async () => {},
};
const alamatRepo = { updateAlamat: async (id, alamat) => { cari(id).alamat = alamat; jejak.alamat.push([id, alamat]); return true; } };

const svc = authController.service;
svc.userRepository = userRepo; svc.tokenRepository = tokenRepo;
svc.customerRepository = alamatRepo; svc.adminRepository = alamatRepo;
auth.userRepository = userRepo; auth.tokenRepository = tokenRepo;
const resetPembatas = () => { svc.pembatas = new PembatasPercobaan(); };

const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api`;
test.after(() => server.close());

const api = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, ...(await res.json()) };
};
const login = async (username, password) => (await api('/auth/login', { method: 'POST', body: { username, password } }));
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

const LAMA = 'Lama#Pass1';
const BARU = 'Baru#Pass2x';

// ================================================================
test('langkah 1: verifikasi password lama', async () => {
  resetPembatas(); users.clear(); dicabut.clear();
  tambahUser('USR1', 'budi', LAMA);
  const { data: { token } } = await login('budi', LAMA);

  assert.equal((await api('/auth/password/verifikasi', { method: 'POST', body: { password_lama: LAMA } })).status, 401, 'tanpa token ditolak');
  const kosong = await api('/auth/password/verifikasi', { method: 'POST', body: {}, token });
  assert.equal(kosong.status, 400); assert.match(kosong.message, /wajib diisi/);
  const salah = await api('/auth/password/verifikasi', { method: 'POST', body: { password_lama: 'salah' }, token });
  assert.equal(salah.status, 403, 'password salah = 403, bukan 401 (agar frontend tidak logout)'); assert.equal(salah.message, 'Password lama salah');
  const benar = await api('/auth/password/verifikasi', { method: 'POST', body: { password_lama: LAMA }, token });
  assert.equal(benar.status, 200); assert.equal(benar.data.valid, true);
  assert.ok(!JSON.stringify(benar).includes('password":"'), 'hash tidak dikirim ke klien');
});

test('pembatas percobaan: 5 salah -> terkunci (429), sukses mereset hitungan, user lain tidak terdampak', async () => {
  resetPembatas(); users.clear(); dicabut.clear();
  tambahUser('USR1', 'budi', LAMA); tambahUser('USR2', 'sari', LAMA);
  const { data: { token } } = await login('budi', LAMA);
  const { data: { token: tokenSari } } = await login('sari', LAMA);
  const cek = (pw, t = token) => api('/auth/password/verifikasi', { method: 'POST', body: { password_lama: pw }, token: t });

  for (let i = 0; i < 4; i++) assert.equal((await cek('salah')).status, 403);
  assert.equal((await cek(LAMA)).status, 200, 'benar di percobaan ke-5 lolos dan mereset hitungan');
  for (let i = 0; i < 4; i++) assert.equal((await cek('salah')).status, 403, 'hitungan mulai dari awal');

  assert.equal((await cek('salah')).status, 403);          // gagal ke-5 -> terkunci
  const terkunci = await cek(LAMA);                         // bahkan password benar ditolak saat terkunci
  assert.equal(terkunci.status, 429); assert.match(terkunci.message, /Coba lagi dalam \d+ menit/);
  assert.equal((await cek('salah', tokenSari)).status, 403, 'sari tidak ikut terkunci');
  const ganti = await api('/auth/password', { method: 'PUT', body: { password_lama: LAMA, password_baru: BARU }, token });
  assert.equal(ganti.status, 429, 'ganti password juga terkunci (bucket yang sama)');
});

test('pembatas percobaan (unit, jam tiruan): kunci berakhir dan jendela waktu mereset hitungan', () => {
  let t = 0;
  const p = new PembatasPercobaan({ maksGagal: 3, jendelaMs: 1000, kunciMs: 5000, sekarang: () => t });
  p.catatGagal('a'); p.catatGagal('a');
  t = 1500; p.catatGagal('a');                              // di luar jendela -> mulai lagi dari 1
  p.periksa('a');                                           // belum terkunci
  p.catatGagal('a'); p.catatGagal('a');                     // total 3 di jendela baru -> terkunci
  assert.throws(() => p.periksa('a'), (e) => e.statusCode === 429);
  t = 1500 + 4999; assert.throws(() => p.periksa('a'), (e) => e.statusCode === 429);
  t = 1500 + 5000; p.periksa('a');                          // kunci selesai
});

test('langkah 2: validasi password baru', async () => {
  resetPembatas(); users.clear(); dicabut.clear();
  tambahUser('USR1', 'budi.santoso', LAMA);
  const { data: { token } } = await login('budi.santoso', LAMA);
  const ganti = (body) => api('/auth/password', { method: 'PUT', body, token });

  assert.equal((await ganti({ password_baru: BARU })).status, 400, 'tanpa password lama');
  const salah = await ganti({ password_lama: 'salah', password_baru: BARU });
  assert.equal(salah.status, 403); assert.equal(salah.message, 'Password lama salah');

  const kosong = await ganti({ password_lama: LAMA });
  assert.equal(kosong.status, 400); assert.match(kosong.message, /password_baru wajib diisi/);

  const lemah = await ganti({ password_lama: LAMA, password_baru: 'abc' });
  assert.equal(lemah.status, 400);
  for (const kata of ['pendek', 'huruf kapital', 'angka', 'simbol']) assert.match(lemah.message, new RegExp(kata));

  assert.match((await ganti({ password_lama: LAMA, password_baru: 'Ada Spasi#1' })).message, /spasi/);
  assert.match((await ganti({ password_lama: LAMA, password_baru: 'Aaaaa#1234' })).message, /berulang/);
  assert.match((await ganti({ password_lama: LAMA, password_baru: 'Budi.Santoso#1' })).message, /username/);
  assert.match((await ganti({ password_lama: LAMA, password_baru: 'Aa1#' + 'x'.repeat(80) })).message, /terlalu panjang/);

  const sama = await ganti({ password_lama: LAMA, password_baru: LAMA });
  assert.equal(sama.status, 400); assert.match(sama.message, /tidak boleh sama/);

  assert.equal(users.get('USR1').password_diubah_at, null, 'semua percobaan gagal: password tidak berubah');
  assert.ok(bcrypt.compareSync(LAMA, users.get('USR1').password));
});

test('ganti password berhasil: sesi lama dicabut, login memakai password baru', async () => {
  resetPembatas(); users.clear(); dicabut.clear();
  tambahUser('USR1', 'budi', LAMA);
  const a = (await login('budi', LAMA)).data.token;         // perangkat A (yang mengganti)
  const b = (await login('budi', LAMA)).data.token;         // perangkat B (sesi lain)
  await tidur(1100);                                        // iat token diukur per detik

  const hasil = await api('/auth/password', { method: 'PUT', body: { password_lama: LAMA, password_baru: BARU }, token: a });
  assert.equal(hasil.status, 200); assert.match(hasil.message, /berhasil diubah/);

  const u = users.get('USR1');
  assert.ok(u.password !== BARU && u.password.startsWith('$2'), 'disimpan sebagai hash bcrypt');
  assert.ok(bcrypt.compareSync(BARU, u.password) && !bcrypt.compareSync(LAMA, u.password));
  assert.ok(u.password_diubah_at instanceof Date);

  const tokenA = await api('/auth/saya', { token: a });
  assert.equal(tokenA.status, 401); assert.match(tokenA.message, /Sesi sudah berakhir/);
  const tokenB = await api('/auth/saya', { token: b });
  assert.equal(tokenB.status, 401); assert.match(tokenB.message, /Password akun telah diubah/);

  assert.equal((await login('budi', LAMA)).status, 401, 'password lama tidak bisa dipakai login');
  const baru = await login('budi', BARU);
  assert.equal(baru.status, 200);
  assert.equal((await api('/auth/saya', { token: baru.data.token })).status, 200, 'token baru langsung berlaku');
});

test('PATCH /auth/profil: username butuh password saat ini, alamat/foto tidak', async () => {
  resetPembatas(); users.clear(); dicabut.clear(); jejak.alamat.length = 0;
  tambahUser('USR1', 'budi', LAMA);
  const { data: { token } } = await login('budi', LAMA);
  const patch = (body) => api('/auth/profil', { method: 'PATCH', body, token });

  assert.equal((await patch({})).status, 400, 'tidak ada yang diubah');
  const alamat = await patch({ alamat: 'Jl. Dago No. 10, Bandung' });
  assert.equal(alamat.status, 200); assert.equal(alamat.data.alamat, 'Jl. Dago No. 10, Bandung');
  assert.equal((await patch({ alamat: 'pendek' })).status, 400);
  assert.equal((await patch({ alamat: null })).status, 200, 'alamat boleh dikosongkan');

  assert.equal((await patch({ username: 'budi.baru' })).status, 400, 'tanpa password saat ini');
  const salah = await patch({ username: 'budi.baru', password_saat_ini: 'salah' });
  assert.equal(salah.status, 403); assert.equal(salah.message, 'Password saat ini salah');
  assert.equal(users.get('USR1').username, 'budi', 'username belum berubah');
  const ok = await patch({ username: 'budi.baru', password_saat_ini: LAMA });
  assert.equal(ok.status, 200); assert.equal(ok.data.username, 'budi.baru');
  assert.equal((await login('budi.baru', LAMA)).status, 200, 'login dengan username baru');

  assert.equal((await patch({ username: 'Ab' })).status, 400, 'username tidak valid');
  const jpeg = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]).toString('base64');
  assert.equal((await patch({ foto_profil: jpeg })).status, 200);
  assert.equal((await patch({ foto_profil: 'data:image/jpeg;base64,' + Buffer.from('bukan gambar').toString('base64') })).status, 400, 'isi bukan JPEG');
  assert.equal((await patch({ foto_profil: 'http://situs.lain/foto.jpg' })).status, 400);
  assert.equal((await patch({ foto_profil: null })).status, 200, 'hapus foto');
});

test('PATCH /auth/profil: tebak password lewat ganti username ikut dibatasi', async () => {
  resetPembatas(); users.clear(); dicabut.clear();
  tambahUser('USR1', 'budi', LAMA);
  const { data: { token } } = await login('budi', LAMA);
  for (let i = 0; i < 5; i++) {
    assert.equal((await api('/auth/profil', { method: 'PATCH', body: { username: 'budi.baru', password_saat_ini: 'salah' }, token })).status, 403);
  }
  const terkunci = await api('/auth/profil', { method: 'PATCH', body: { username: 'budi.baru', password_saat_ini: LAMA }, token });
  assert.equal(terkunci.status, 429);
});

test('Profil.validasiPasswordBaru', () => {
  const ok = ['Abcdef#12', 'Kucing&Anjing9', 'Zz9!zZ9!zZ'];
  const gagal = ['', 'abcdefg', 'abcdefgh', 'ABCDEFG#1', 'abcdefG#', 'Abc def#12', 'Aaaaa#1234', 'x'];
  for (const p of ok) assert.equal(Profil.validasiPasswordBaru(p, 'budi'), p);
  for (const p of gagal) assert.throws(() => Profil.validasiPasswordBaru(p, 'budi'), (e) => e.statusCode === 400, `harus ditolak: "${p}"`);
});

test('UserRepository.findById tetap jalan jika migrasi password_diubah_at belum dijalankan', async () => {
  const { default: UserRepository } = await import('../src/repositories/UserRepository.js');
  const repo = new UserRepository();
  const aslinya = console.warn; let peringatan = 0; console.warn = () => { peringatan++; };
  repo.db = { query: async (sql) => {
    if (sql.includes('password_diubah_at')) { const e = new Error('column "password_diubah_at" does not exist'); e.code = '42703'; throw e; }
    return { rows: [{ id_user: 'USR1', username: 'budi', role: 'CUSTOMER' }] };
  } };
  try {
    const u = await repo.findById('USR1');
    assert.equal(u.id_user, 'USR1'); assert.equal(u.password_diubah_at, undefined);
    await repo.findById('USR1');
    assert.equal(peringatan, 1, 'peringatan hanya dicetak sekali');
    repo.db = { query: async () => { const e = new Error('koneksi putus'); e.code = '08006'; throw e; } };
    await assert.rejects(() => repo.findById('USR1'), /koneksi putus/, 'error lain tetap dilempar');
  } finally { console.warn = aslinya; }
});
