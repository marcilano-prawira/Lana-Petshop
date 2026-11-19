import { JSDOM } from 'jsdom';
import { File as NodeFile } from 'node:buffer';
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
const { window } = dom;
for (const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLCanvasElement','Node','Event','MouseEvent','sessionStorage','localStorage','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','FileReader']) {
  try { Object.defineProperty(globalThis, k, { value: window[k], configurable: true, writable: true }); } catch {}
}
window.scrollTo = () => {};
globalThis.FocusEvent = window.FocusEvent;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// stub kanvas & decoder gambar (jsdom tidak punya)
globalThis.createImageBitmap = async () => ({ width: 800, height: 1200, close() {} });
window.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, drawImage() {}, fillStyle: '' });
window.HTMLCanvasElement.prototype.toBlob = (cb) => cb(new window.Blob([new Uint8Array(2048)], { type: 'image/jpeg' }));

const { createServer } = await import('vite');
const React = (await import('react')).default;
const { act } = await import('react');
const { createRoot } = await import('react-dom/client');
const { MemoryRouter } = await import('react-router-dom');
const vite = await createServer({ root: process.cwd(), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { AuthProvider } = await vite.ssrLoadModule('/src/context/AuthContext.jsx');
const App = (await vite.ssrLoadModule('/src/App.jsx')).default;

/* ------------------------- backend tiruan ------------------------- */
const iso = (h) => new Date(Date.now() + h * 3600e3).toISOString();
let pets, pesanan, pembayaran, progress, log, petEndpointAda, profilSrv, lastPatch, passwordSrv, lastPassword;
function reset() {
  petEndpointAda = true; log = [];
  lastPatch = null;
  lastPassword = null;
  passwordSrv = { sekarang: 'Kucing#2026', terkunci: false };
  profilSrv = { id_user: 'USR0005', username: 'zain', role: 'CUSTOMER', nama: 'Zain Satrio', alamat: 'Jl. Lama No. 1, Cimahi', no_hp_customer: '081234567890', foto_profil: null };
  pets = [{ id_pet: 'PET0001', nama_pet: 'Mochi', jenis_pet: 'Kucing' }];
  const dasar = { id_user: 5, nama_customer: 'Zain', nama_pet: 'Mochi', tanggal_pesanan: iso(-5), jenis_pesanan: 'GROOMING', nama_layanan: 'Full Grooming', harga_paket: '120000.00' };
  pesanan = [
    { ...dasar, id_pesanan: 'PSN0001', status_pesanan: 'MENUNGGU' },
    { ...dasar, id_pesanan: 'PSN0002', status_pesanan: 'MENUNGGU' },
    { ...dasar, id_pesanan: 'PSN0003', status_pesanan: 'MENUNGGU' },
    { ...dasar, id_pesanan: 'PSN0004', status_pesanan: 'DIPROSES' },
    { ...dasar, id_pesanan: 'PSN0005', jenis_pesanan: 'HOTEL', nama_layanan: null, harga_paket: null, jam_checkin: iso(24), jam_checkout: iso(24 + 72), tarif_per_hari: '75000.00', status_pesanan: 'MENUNGGU' },
  ];
  const foto = 'data:image/jpeg;base64,/9j/AAAA';
  pembayaran = [
    { id_pembayaran: 'PBY0011', id_pesanan: 'PSN0002', id_user: 5, nama_customer: 'Zain', total_harga: '120000.00', metode_pembayaran: 'QRIS', bukti_pembayaran: foto, status_pembayaran: 'DITOLAK', tanggal_bayar: iso(-3) },
    { id_pembayaran: 'PBY0012', id_pesanan: 'PSN0003', id_user: 5, nama_customer: 'Zain', total_harga: '120000.00', metode_pembayaran: 'Transfer Bank', bukti_pembayaran: foto, status_pembayaran: 'MENUNGGU', tanggal_bayar: iso(-2) },
    { id_pembayaran: 'PBY0013', id_pesanan: 'PSN0004', id_user: 5, nama_customer: 'Zain', total_harga: '120000.00', metode_pembayaran: 'QRIS', bukti_pembayaran: foto, status_pembayaran: 'TERVERIFIKASI', tanggal_bayar: iso(-4), tanggal_verifikasi: iso(-3) },
  ];
  progress = { PSN0004: [{ id_progress: 2, status_progress: 'Pembayaran Terverifikasi', keterangan: 'Pesanan akan segera diproses', updated_at: iso(-3) }, { id_progress: 1, status_progress: 'Menunggu Pembayaran', keterangan: 'Pesanan grooming berhasil dibuat', updated_at: iso(-5) }] };
}
const total = (p) => (p.jenis_pesanan === 'GROOMING' ? 120000 : 225000);
globalThis.fetch = async (url, opts = {}) => {
  const path = String(url).replace(/^.*\/api/, '');
  const method = opts.method || 'GET';
  const body = opts.body ? JSON.parse(opts.body) : {};
  const res = (status, data, message = 'ok') => ({ ok: status < 400, status, json: async () => (status < 400 ? { success: true, message, data } : { success: false, message }) });
  log.push(`${method} ${path}`);
  let m;
  if (path === '/pesanan' && method === 'GET') return res(200, pesanan);
  if ((m = path.match(/^\/pesanan\/([A-Za-z0-9]+)$/)) && method === 'GET') { const p = pesanan.find((x) => x.id_pesanan == m[1]); return p ? res(200, { ...p, total_harga: total(p) }) : res(404, null, 'Pesanan tidak ditemukan'); }
  if ((m = path.match(/^\/pesanan\/([A-Za-z0-9]+)\/batal$/))) { const p = pesanan.find((x) => x.id_pesanan == m[1]); p.status_pesanan = 'DIBATALKAN'; return res(200, p); }
  if (path === '/pesanan/pet-saya' && method === 'GET') return res(200, pets);
  if (path === '/pesanan/pet-saya' && method === 'POST') { if (!petEndpointAda) return res(404, null, 'Route tidak ditemukan'); pets.push({ id_pet: 'PET000' + (pets.length + 1), nama_pet: body.nama_pet, jenis_pet: body.jenis_pet, ras_pet: body.ras_pet }); return res(201, pets.at(-1)); }
  if (path === '/pembayaran' && method === 'GET') return res(200, pembayaran);
  if (path === '/pembayaran' && method === 'POST') {
    log.push(`BODY bukti=${String(body.bukti_pembayaran).slice(0, 22)} metode=${body.metode_pembayaran} id=${typeof body.id_pesanan}:${body.id_pesanan}`);
    const ada = pembayaran.find((x) => x.id_pesanan === body.id_pesanan);
    if (ada && ada.status_pembayaran !== 'DITOLAK') return res(409, null, 'Pesanan ini sudah memiliki pembayaran');
    if (ada) Object.assign(ada, { metode_pembayaran: body.metode_pembayaran, bukti_pembayaran: body.bukti_pembayaran, status_pembayaran: 'MENUNGGU', tanggal_bayar: iso(0) });
    else pembayaran.push({ id_pembayaran: 'PBY0020', id_pesanan: body.id_pesanan, id_user: 5, nama_customer: 'Zain', total_harga: '120000.00', metode_pembayaran: body.metode_pembayaran, bukti_pembayaran: body.bukti_pembayaran, status_pembayaran: 'MENUNGGU', tanggal_bayar: iso(0) });
    return res(201, {});
  }
  if ((m = path.match(/^\/pembayaran\/([A-Za-z0-9]+)\/verifikasi$/))) {
    const b = pembayaran.find((x) => x.id_pembayaran == m[1]);
    if (b.status_pembayaran !== 'MENUNGGU') return res(409, null, 'Pembayaran ini sudah diverifikasi sebelumnya');
    b.status_pembayaran = body.status_pembayaran; b.tanggal_verifikasi = iso(0);
    if (body.status_pembayaran === 'TERVERIFIKASI') pesanan.find((x) => x.id_pesanan === b.id_pesanan).status_pesanan = 'DIPROSES';
    return res(200, b);
  }
  if ((m = path.match(/^\/progress\/pesanan\/([A-Za-z0-9]+)$/))) return res(200, { riwayat: progress[m[1]] ?? [] });
  if (path === '/paket-grooming') return res(200, [
    { id_layanan: 'LYN0001', nama_layanan: 'Mandi Basic', detail_layanan: 'Mandi + sisir', jenis_paket: 'Basic', harga_paket: '50000.00' },
    { id_layanan: 'LYN0002', nama_layanan: 'Full Grooming', detail_layanan: 'Lengkap', jenis_paket: 'Premium', harga_paket: '120000.00' }]);
  if (path === '/pesanan/grooming' && method === 'POST') { log.push(`ORDER grooming ${typeof body.id_pet}:${body.id_pet} ${typeof body.id_layanan}:${body.id_layanan}`);
    return res(201, { id_pesanan: 'PSN0099', nama_pet: 'Mochi', nama_layanan: 'Full Grooming', harga_paket: '120000.00', jenis_pesanan: 'GROOMING' }); }
  if (path === '/pesanan/hotel' && method === 'POST') { log.push(`ORDER hotel ${typeof body.id_pet}:${body.id_pet}`);
    return res(201, { id_pesanan: 'PSN0098', nama_pet: 'Mochi', jam_checkin: body.jam_checkin, jam_checkout: body.jam_checkout, tarif_per_hari: '75000.00', jenis_pesanan: 'HOTEL' }); }
  if (path === '/auth/password/verifikasi' && method === 'POST') {
    if (passwordSrv.terkunci) return res(429, null, 'Terlalu banyak percobaan password yang salah. Coba lagi dalam 15 menit.');
    if (body.password_lama !== passwordSrv.sekarang) return res(403, null, 'Password lama salah');
    return res(200, { valid: true }, 'Password lama benar');
  }
  if (path === '/auth/password' && method === 'PUT') {
    lastPassword = body;
    if (body.password_lama !== passwordSrv.sekarang) return res(403, null, 'Password lama salah');
    passwordSrv.sekarang = body.password_baru;
    return res(200, null, 'Password berhasil diubah. Silakan login kembali dengan password baru.');
  }
  if (path === '/auth/logout' && method === 'POST') return res(200, null, 'Berhasil keluar akun');
  if (path === '/auth/saya' && method === 'GET') return res(200, { ...profilSrv });
  if (path === '/auth/profil' && method === 'PATCH') {
    lastPatch = body; log.push(`PATCH profil ${Object.keys(body).sort().join(',')}`);
    if (body.username !== undefined && body.username !== profilSrv.username) {
      if (body.password_saat_ini !== 'Kucing#2026') return res(403, null, 'Password saat ini salah');
      if (body.username === 'diambil') return res(409, null, 'Username sudah digunakan, pilih username lain');
      profilSrv.username = body.username;
    }
    if (body.alamat !== undefined) profilSrv.alamat = body.alamat;
    if (body.foto_profil !== undefined) profilSrv.foto_profil = body.foto_profil;
    return res(200, { ...profilSrv });
  }
  return res(404, null, 'tidak ada');
};

/* ---------------------------- pembantu ---------------------------- */
function sesi(role) {
  if (profilSrv) { profilSrv.role = role; profilSrv.nama = role === 'ADMIN' ? 'Kasir Dewi' : 'Zain Satrio'; if (role !== 'CUSTOMER') delete profilSrv.no_hp_customer; }
  sessionStorage.setItem('lana_session', JSON.stringify({ token: 't', user: { username: 'u', nama: role === 'ADMIN' ? 'Kasir Dewi' : 'Zain', role }, mulai: Date.now(), expiresAt: Date.now() + 7200e3 }));
}
const tunggu = (ms = 40) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const teks = (el = document.body) => el.textContent.replace(/\s+/g, ' ');
let gagal = 0;
const cek = (k, nama) => { console.log(k ? '  PASS' : '  FAIL', nama); if (!k) { gagal++; process.exitCode = 1; } };
async function buka(path) {
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(AuthProvider, null, React.createElement(App)))); });
  await tunggu(80);
  return root;
}
const klik = (el) => act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })); });
const tombol = (t, root = document) => [...root.querySelectorAll('button, a.btn')].find((b) => b.textContent.trim().startsWith(t));
const lepasFokus = (el) => act(async () => { el.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true })); });
const submit = (f) => act(async () => { f.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); });
const isi = (el, v) => act(async () => { const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set; set.call(el, v); el.dispatchEvent(new window.Event('input', { bubbles: true })); el.dispatchEvent(new window.Event('change', { bubbles: true })); });
const pilihFile = async (input, file) => { Object.defineProperty(input, 'files', { value: [file], configurable: true }); await act(async () => { input.dispatchEvent(new window.Event('change', { bubbles: true })); }); await tunggu(80); };
const jpg = (n = 3000, nama = 'bukti.jpg') => new NodeFile([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, ...new Array(n).fill(7)])], nama, { type: 'image/jpeg' });

/* ============================ SKENARIO ============================ */
console.log('FORM PESAN (ID string)');
const lokalIso = (jam) => { const d = new Date(Date.now() + jam * 3600e3); const p2 = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`; };
reset(); sesi('CUSTOMER');
let root = await buka('/pesan-grooming?paket=LYN0002');
cek(document.querySelector('input[name="id_layanan"][value="LYN0002"]')?.checked, 'paket dari ?paket=LYN0002 terpilih otomatis');
await klik(document.querySelector('input[name="id_pet"][value="PET0001"]'));
await submit(document.querySelector('form')); await tunggu(80);
cek(log.includes('ORDER grooming string:PET0001 string:LYN0002'), 'grooming: id_pet & id_layanan dikirim sebagai STRING apa adanya (bukan NaN/null)');
cek(teks().includes('Pesanan berhasil dibuat') && !!document.querySelector('a[href="/bayar/PSN0099"]'), 'hasil grooming: tombol "Bayar sekarang" -> /bayar/PSN0099');
root.unmount();
root = await buka('/pesan-hotel');
await klik(document.querySelector('input[name="id_pet"][value="PET0001"]'));
await isi(document.getElementById('checkin'), lokalIso(24));
await isi(document.getElementById('checkout'), lokalIso(24 + 72));
await submit(document.querySelector('form')); await tunggu(80);
cek(log.includes('ORDER hotel string:PET0001'), 'hotel: id_pet dikirim sebagai string');
cek(teks().includes('Pesanan berhasil dibuat') && !!document.querySelector('a[href="/bayar/PSN0098"]') && teks().includes('225.000'), 'hasil hotel: total 225.000 + tombol bayar -> /bayar/PSN0098');
root.unmount();

console.log('PESANAN SAYA (customer)');
reset(); sesi('CUSTOMER');
root = await buka('/pesanan');
let t = teks();
cek(t.includes('Menunggu pembayaran') && t.includes('Pembayaran ditolak · Kirim ulang bukti') && t.includes('Menunggu verifikasi admin') && t.includes('Pembayaran terverifikasi · Diproses'), '4 keadaan pesanan tampil dengan label berbeda');
cek(teks(document.querySelector('.tab-bar')).includes('Perlu tindakan 3'), 'tab "Perlu tindakan" = 3 (belum bayar, ditolak, hotel belum bayar)');
cek(document.querySelectorAll('a[href="/bayar/PSN0002"]')[0]?.textContent.includes('Kirim ulang bukti'), 'pesanan ditolak punya tombol "Kirim ulang bukti"');
cek(t.includes('Tidak dapat dibatalkan'), 'pesanan yang sedang diverifikasi tidak bisa dibatalkan');
cek(t.includes('225.000'), 'total hotel dihitung (3 hari x 75.000)');
await klik(tombol('Lihat progres', document.querySelectorAll('.pesanan')[3]));
await tunggu(60);
cek(teks().includes('Pembayaran Terverifikasi') && teks().includes('Pesanan grooming berhasil dibuat'), 'linimasa progres tampil');
await klik(tombol('Batalkan', document.querySelectorAll('.pesanan')[0]));
cek(teks(document.querySelector('.modal')).includes('Batalkan pesanan?'), 'konfirmasi batal muncul');
await klik(tombol('Ya, batalkan', document.querySelector('.modal')));
await tunggu(80);
cek(log.includes('PATCH /pesanan/PSN0001/batal') && teks().includes('berhasil dibatalkan') && !document.querySelector('.modal'), 'pesanan #1 dibatalkan lewat API, modal tertutup');
await klik([...document.querySelectorAll('.tab')].find((b) => b.textContent.startsWith('Dibatalkan')));
cek(teks().includes('Pesanan #PSN0001'), 'pesanan PSN0001 pindah ke tab Dibatalkan');
root.unmount();

console.log('BAYAR (customer)');
reset(); sesi('CUSTOMER');
root = await buka('/bayar/PSN0001');
cek(teks().includes('120.000') && !!document.getElementById('bukti'), 'form bayar tampil untuk pesanan belum dibayar');
await submit(document.querySelector('form'));
cek(teks().includes('Metode pembayaran wajib dipilih.') && teks().includes('Foto bukti pembayaran wajib diunggah.'), 'submit kosong -> 2 alasan error');
cek(!log.some((l) => l.startsWith('POST /pembayaran')), 'tidak ada request terkirim saat invalid');
await pilihFile(document.getElementById('bukti'), new NodeFile([new TextEncoder().encode('ini bukan gambar sama sekali')], 'catatan.jpg', { type: 'image/jpeg' }));
cek(teks().includes('bukan foto yang valid'), 'file palsu (ekstensi .jpg tapi isi teks) ditolak berdasarkan isi');
await pilihFile(document.getElementById('bukti'), new NodeFile([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(11 * 1024 * 1024).fill(1)])], 'besar.jpg', { type: 'image/jpeg' }));
cek(teks().includes('Ukuran foto terlalu besar'), 'foto > 10 MB ditolak dengan alasan ukuran');
await pilihFile(document.getElementById('bukti'), jpg());
cek(!!document.querySelector('.preview img') && teks().includes('bukti.jpg'), 'foto valid -> pratinjau tampil');
await klik(document.querySelector('input[name="metode"][value="QRIS"]'));
await submit(document.querySelector('form')); await tunggu(120);
cek(log.includes('BODY bukti=data:image/jpeg;base64 metode=QRIS id=string:PSN0001'), 'body: bukti = data URL JPEG base64, metode benar, id_pesanan angka');
cek(teks().includes('Bukti pembayaran terkirim') && teks().includes('Menunggu verifikasi'), 'setelah kirim: status menunggu verifikasi admin');
cek(!document.querySelector('form'), 'form upload hilang (tidak bisa kirim dobel)');
root.unmount();

console.log('KIRIM ULANG setelah ditolak');
reset(); sesi('CUSTOMER');
root = await buka('/bayar/PSN0002');
cek(teks().includes('Pembayaran sebelumnya ditolak admin') && teks().includes('Kirim ulang bukti') && teks().includes('Bukti sebelumnya (ditolak)'), 'banner ditolak + form kirim ulang + bukti lama');
await pilihFile(document.getElementById('bukti'), jpg(4000, 'baru.jpg'));
await klik(document.querySelector('input[name="metode"][value="Transfer Bank"]'));
await submit(document.querySelector('form')); await tunggu(120);
cek(pembayaran.find((b) => b.id_pesanan === 'PSN0002').status_pembayaran === 'MENUNGGU' && teks().includes('Menunggu admin memeriksa'), 'kirim ulang -> status kembali MENUNGGU');
root.unmount();
root = await buka('/bayar/PSN0003');
cek(!document.querySelector('form') && teks().includes('Anda tidak perlu mengirim ulang'), 'pesanan yang sedang diverifikasi: tidak ada form');
root.unmount();

console.log('ADMIN');
reset(); sesi('ADMIN');
root = await buka('/home');
cek(teks().includes('Verifikasi Pembayaran') && teks().includes('1 menunggu'), 'home admin: menu verifikasi + lencana "1 menunggu"');
root.unmount();
root = await buka('/admin/pembayaran');
cek(teks().includes('Menunggu verifikasi 1') && document.querySelectorAll('tbody tr').length === 1, 'antrean: 1 pembayaran menunggu');
await klik(tombol('Periksa'));
await tunggu(80);
let modal = document.querySelector('.modal');
cek(modal && !!modal.querySelector('.foto-bukti img') && teks(modal).includes('Full Grooming') && teks(modal).includes('120.000'), 'modal: foto bukti + layanan + nominal tampil');
await klik(tombol('Terima pembayaran', modal));
const verifikasi = tombol('Ya, verifikasi', document.querySelector('.modal'));
cek(verifikasi.disabled, 'tombol verifikasi nonaktif sebelum admin mencentang pemeriksaan');
await klik(document.querySelector('.modal input[type="checkbox"]'));
cek(!tombol('Ya, verifikasi', document.querySelector('.modal')).disabled, 'tombol aktif setelah centang');
await klik(tombol('Ya, verifikasi', document.querySelector('.modal'))); await tunggu(100);
cek(log.includes('PATCH /pembayaran/PBY0012/verifikasi') && pembayaran.find((b) => b.id_pembayaran === 'PBY0012').status_pembayaran === 'TERVERIFIKASI' && pesanan.find((p) => p.id_pesanan === 'PSN0003').status_pesanan === 'DIPROSES', 'diverifikasi -> pembayaran TERVERIFIKASI & pesanan DIPROSES');
cek(!document.querySelector('.modal') && teks().includes('diverifikasi'), 'modal tertutup + notifikasi sukses');
root.unmount();

reset(); pembayaran.push({ ...pembayaran[1], id_pembayaran: 'PBY0014', id_pesanan: 'PSN0001', status_pembayaran: 'MENUNGGU' });
root = await buka('/admin/pembayaran');
await klik(tombol('Periksa')); await tunggu(80);
await klik(tombol('Tolak', document.querySelector('.modal')));
cek(teks(document.querySelector('.modal')).includes('wajib mengirim ulang'), 'tolak: konfirmasi menyebut pelanggan wajib kirim ulang');
await klik(tombol('Ya, tolak', document.querySelector('.modal'))); await tunggu(100);
cek(pembayaran.find((b) => b.id_pembayaran === 'PBY0012').status_pembayaran === 'DITOLAK' || pembayaran.some((b) => b.status_pembayaran === 'DITOLAK' && b.id_pembayaran !== 'PBY0011'), 'pembayaran berstatus DITOLAK di server');
cek(teks().includes('ditolak. Pelanggan diminta mengirim ulang'), 'notifikasi penolakan tampil');
root.unmount();

console.log('HEWAN SAYA & GUARD');
reset(); sesi('CUSTOMER');
root = await buka('/hewan-saya');
await submit(document.querySelector('form'));
cek(teks().includes('Nama hewan wajib diisi.') && teks().includes('Jenis hewan wajib dipilih.'), 'submit kosong -> alasan error');
await isi(document.getElementById('nama_pet'), 'Bruno');
await isi(document.getElementById('jenis_pet'), 'Anjing');
await submit(document.querySelector('form')); await tunggu(100);
cek(teks().includes('Bruno berhasil didaftarkan') && teks().includes('Bruno'), 'hewan baru terdaftar & muncul di daftar');
petEndpointAda = false;
await isi(document.getElementById('nama_pet'), 'Luna');
await isi(document.getElementById('jenis_pet'), 'Kucing');
await submit(document.querySelector('form')); await tunggu(100);
cek(teks().includes('belum tersedia di backend'), 'endpoint belum ada (404) -> pesan jelas, bukan error mentah');
root.unmount();
root = await buka('/admin/pembayaran');
cek(teks().includes('Layanan kami') && !teks().includes('Periksa foto bukti dari pelanggan'), 'customer membuka /admin/pembayaran -> dialihkan ke home (bukan halaman admin)');
root.unmount();

console.log('SOSIAL MEDIA (login & registrasi)');
reset(); sessionStorage.removeItem('lana_session');
let rootS = await buka('/login');
cek(!teks().includes('Paket grooming sesuai kebutuhan') && !teks().includes('Pet hotel yang nyaman') && !teks().includes('Pantau progres layanan'), 'login: kotak "paket" (3 poin) sudah dihapus');
cek(!document.querySelector('.auth__points'), 'login: elemen .auth__points tidak ada lagi');
cek(['WhatsApp', 'Instagram', 'TikTok'].every((n) => teks(document.querySelector('.auth__sosial')).includes(n)), 'login: link WhatsApp, Instagram, TikTok tampil');
cek(document.querySelectorAll('.auth__sosial .sosial').length === 3, 'login: tepat 3 tombol sosial media');
cek(document.querySelectorAll('.sosial--nonaktif').length === 3 && !document.querySelector('.auth__sosial a'), 'url belum diisi di config -> tombol tampil tapi nonaktif (bukan link kosong)');
rootS.unmount();
rootS = await buka('/registrasi');
cek(!document.querySelector('.auth__points') && document.querySelectorAll('.auth__sosial .sosial').length === 3, 'registrasi: poin dihapus, sosial media tampil');
rootS.unmount();
{
  const { LinkSosial } = await vite.ssrLoadModule('/src/components/ui.jsx');
  document.body.innerHTML = '<div id="root"></div>';
  const r2 = createRoot(document.getElementById('root'));
  await act(async () => { r2.render(React.createElement('div', null,
    React.createElement(LinkSosial, { s: { nama: 'Instagram', url: 'https://instagram.com/lana_petshop', petunjuk: 'Ikuti Instagram kami' } }),
    React.createElement(LinkSosial, { s: { nama: 'WhatsApp', url: 'javascript:alert(1)', petunjuk: 'x' } }),
    React.createElement(LinkSosial, { s: { nama: 'TikTok', url: 'ftp://x', petunjuk: 'x' } }))); });
  const a = document.querySelector('a.sosial');
  cek(a && a.getAttribute('href') === 'https://instagram.com/lana_petshop' && a.target === '_blank' && a.rel.includes('noopener'), 'url https valid -> link buka di tab baru dengan rel=noopener');
  cek(document.querySelectorAll('a.sosial').length === 1 && document.querySelectorAll('.sosial--nonaktif').length === 2, 'url javascript:/ftp: ditolak -> jadi tombol nonaktif');
  r2.unmount();
}

console.log('PROFIL: tombol di topbar');
reset(); sesi('CUSTOMER');
profilSrv.foto_profil = 'data:image/jpeg;base64,/9j/AAAA';
root = await buka('/home');
const kanan = document.querySelector('.topbar__right');
const urutan = [...kanan.querySelectorAll('a.btn, button.btn')].map((e) => e.textContent.trim());
cek(urutan.join(',') === 'Profil,Keluar', 'topbar: tombol Profil tepat di sebelah tombol Keluar', urutan.join(','));
cek(kanan.querySelector('a[href="/profil"]'), 'tombol Profil mengarah ke /profil');
cek(kanan.querySelector('.avatar img')?.getAttribute('src') === 'data:image/jpeg;base64,/9j/AAAA', 'avatar topbar menampilkan foto profil dari server');
root.unmount();
reset(); sesi('CUSTOMER');
root = await buka('/home');
cek(!document.querySelector('.topbar .avatar img') && document.querySelector('.topbar .avatar').textContent === 'Z', 'tanpa foto -> avatar memakai huruf pertama nama');
root.unmount();

console.log('PROFIL (customer)');
reset(); sesi('CUSTOMER');
root = await buka('/profil');
cek(teks().includes('Zain Satrio') && teks().includes('Pelanggan') && teks().includes('081234567890'), 'info akun: nama, peran, nomor HP tampil');
cek(document.getElementById('username').value === 'zain' && document.getElementById('alamat').value === 'Jl. Lama No. 1, Cimahi', 'form terisi username & alamat saat ini');
cek(tombol('Simpan perubahan').disabled && teks().includes('Belum ada perubahan'), 'tanpa perubahan: tombol simpan nonaktif');
cek(!document.getElementById('password'), 'kolom password tidak muncul sebelum username diubah');

await isi(document.getElementById('username'), 'Zain Baru');
await lepasFokus(document.getElementById('username'));
cek(teks().includes('Username tidak boleh mengandung spasi') && teks().includes('harus huruf kecil semua'), 'username "Zain Baru" -> alasan: spasi + huruf kapital');
cek(!!document.getElementById('password') && teks().includes('Ada perubahan yang belum disimpan'), 'mengubah username memunculkan kolom password saat ini');
await isi(document.getElementById('username'), 'zain.baru');
await submit(document.querySelector('form'));
cek(teks().includes('Password wajib diisi.') && !log.some((l) => l.startsWith('PATCH profil')), 'username diganti tanpa password -> ditolak di browser, tidak ada request');
await isi(document.getElementById('password'), 'salahbanget');
await submit(document.querySelector('form')); await tunggu(80);
cek(log.includes('PATCH profil password_saat_ini,username') && teks().includes('Password saat ini salah'), 'password salah (403 dari server) -> pesan tampil di kolom password');
cek(!!sessionStorage.getItem('lana_session') && !!document.getElementById('password'), '403 TIDAK membuat pengguna ter-logout (tetap di halaman profil)');
await isi(document.getElementById('username'), 'diambil');
await isi(document.getElementById('password'), 'Kucing#2026');
await submit(document.querySelector('form')); await tunggu(80);
cek(teks().includes('Username "diambil" sudah digunakan'), 'username dipakai orang lain (409) -> pesan di kolom username');
await isi(document.getElementById('username'), 'zain.baru');
await submit(document.querySelector('form')); await tunggu(100);
cek(lastPatch.username === 'zain.baru' && lastPatch.password_saat_ini === 'Kucing#2026' && !('alamat' in lastPatch) && !('foto_profil' in lastPatch), 'body hanya berisi field yang berubah (username + password_saat_ini)');
cek(teks().includes('Profil berhasil disimpan') && teks().includes('Gunakan username baru'), 'notifikasi sukses + pengingat memakai username baru');
cek(JSON.parse(sessionStorage.getItem('lana_session')).user.username === 'zain.baru', 'username di data sesi ikut diperbarui');
cek(!document.getElementById('password') && tombol('Simpan perubahan').disabled, 'setelah simpan: kolom password hilang & tombol simpan nonaktif lagi');

await isi(document.getElementById('alamat'), 'Jl. A');
await lepasFokus(document.getElementById('alamat'));
cek(teks().includes('Alamat terlalu singkat'), 'alamat < 10 karakter -> alasan tampil');
await isi(document.getElementById('alamat'), 'Jl. Setelah Ganti No. 2, Bandung');
await submit(document.querySelector('form')); await tunggu(100);
cek(JSON.stringify(Object.keys(lastPatch)) === '["alamat"]' && lastPatch.alamat === 'Jl. Setelah Ganti No. 2, Bandung', 'ganti alamat saja -> body hanya {alamat}');
await isi(document.getElementById('alamat'), '   ');
await submit(document.querySelector('form')); await tunggu(100);
cek(lastPatch.alamat === null && teks().includes('Alamat dikosongkan'), 'alamat dikosongkan -> dikirim null');

console.log('PROFIL: foto');
await pilihFile(document.getElementById('foto-profil'), new NodeFile([new TextEncoder().encode('ini bukan gambar')], 'palsu.jpg', { type: 'image/jpeg' }));
cek(teks().includes('bukan foto yang valid') && tombol('Simpan perubahan').disabled, 'file palsu (.jpg berisi teks) ditolak, tidak ada perubahan');
await pilihFile(document.getElementById('foto-profil'), jpg(3000, 'aku.jpg'));
cek(teks().includes('Belum disimpan') && teks().includes('aku.jpg') && !!document.querySelector('.profil__avatar .avatar img'), 'foto valid -> pratinjau + penanda "Belum disimpan"');
cek(!tombol('Simpan perubahan').disabled, 'foto baru mengaktifkan tombol simpan');
await submit(document.querySelector('form')); await tunggu(100);
cek(JSON.stringify(Object.keys(lastPatch)) === '["foto_profil"]' && /^data:image\/jpeg;base64,/.test(lastPatch.foto_profil), 'simpan foto -> body hanya {foto_profil} berupa data URL JPEG');
cek(document.querySelector('.topbar .avatar img')?.getAttribute('src') === lastPatch.foto_profil, 'avatar di topbar langsung berganti ke foto baru');
await klik(tombol('Hapus foto'));
cek(teks().includes('Akan dihapus') && !document.querySelector('.profil__avatar .avatar img'), 'hapus foto -> avatar kembali ke huruf, penanda "Akan dihapus"');
await klik(tombol('Batalkan', document.querySelector('.profil__foto')));
cek(!!document.querySelector('.profil__avatar .avatar img') && tombol('Simpan perubahan').disabled, 'batalkan hapus -> foto kembali, tidak ada perubahan');
await klik(tombol('Hapus foto'));
await submit(document.querySelector('form')); await tunggu(100);
cek(lastPatch.foto_profil === null && !document.querySelector('.topbar .avatar img'), 'simpan hapus foto -> foto_profil null, avatar topbar kembali ke huruf');
root.unmount();

console.log('PROFIL: data lama tidak memblokir');
reset(); sesi('CUSTOMER'); profilSrv.alamat = 'Jl. A'; profilSrv.username = 'Zain_LAMA';
root = await buka('/profil');
await pilihFile(document.getElementById('foto-profil'), jpg(2000, 'x.jpg'));
await submit(document.querySelector('form')); await tunggu(100);
cek(lastPatch && JSON.stringify(Object.keys(lastPatch)) === '["foto_profil"]' && !teks().includes('Alamat terlalu singkat'), 'alamat/username lama yang tidak valid TIDAK memblokir perubahan lain (hanya foto terkirim)');
root.unmount();

console.log('PROFIL: admin & pegawai');
reset(); sesi('ADMIN');
root = await buka('/profil');
cek(teks().includes('Admin') && !!document.getElementById('alamat') && !teks().includes('Nomor HP'), 'admin: peran Admin, kolom alamat ada, tanpa nomor HP');
await isi(document.getElementById('alamat'), 'Jl. Kantor Pusat No. 5, Bandung');
await submit(document.querySelector('form')); await tunggu(100);
cek(lastPatch.alamat === 'Jl. Kantor Pusat No. 5, Bandung', 'admin dapat mengubah alamat');
root.unmount();
reset(); sesi('PEGAWAI');
root = await buka('/profil');
cek(!document.getElementById('alamat') && !!document.getElementById('username'), 'pegawai: kolom alamat disembunyikan (backend belum mendukung), username tetap bisa diubah');
root.unmount();

console.log('PROFIL: gagal muat');
reset(); sesi('CUSTOMER');
const fetchAsli = globalThis.fetch;
globalThis.fetch = async (u, o) => (String(u).includes('/auth/saya') ? { ok: false, status: 500, json: async () => ({ success: false, message: 'Terjadi kesalahan pada server' }) } : fetchAsli(u, o));
root = await buka('/profil');
cek(teks().includes('Gagal memuat profil') && !!tombol('Coba lagi'), 'server error saat memuat profil -> pesan + tombol "Coba lagi"');
globalThis.fetch = fetchAsli;
await klik(tombol('Coba lagi')); await tunggu(80);
cek(!!document.getElementById('username'), '"Coba lagi" berhasil memuat form');
root.unmount();

console.log('GANTI PASSWORD (dua langkah)');
reset(); sesi('CUSTOMER');
root = await buka('/profil');
const formLama = () => document.getElementById('password_lama')?.closest('form');
cek(teks().includes('Ganti password') && !!document.getElementById('password_lama') && !document.getElementById('password_baru') && !document.getElementById('password_konfirmasi'), 'awalnya hanya langkah 1 (password lama); form password baru belum ada');
cek(teks().includes('Verifikasi password lama') && teks().includes('Buat password baru'), 'penunjuk 2 langkah tampil');

await submit(formLama());
cek(teks().includes('Password lama wajib diisi.') && !log.some((l) => l.includes('/auth/password')), 'password lama kosong -> ditolak di browser, tidak ada request');

await isi(document.getElementById('password_lama'), 'salahbanget');
await submit(formLama()); await tunggu(80);
cek(log.includes('POST /auth/password/verifikasi') && teks().includes('Password lama salah') && !document.getElementById('password_baru'), 'password lama salah (403) -> pesan di kolom, form password baru tetap tertutup');
cek(!!sessionStorage.getItem('lana_session') && !!document.getElementById('password_lama'), '403 TIDAK membuat pengguna ter-logout');

passwordSrv.terkunci = true;
await submit(formLama()); await tunggu(80);
cek(teks().includes('Terlalu banyak percobaan') && !!sessionStorage.getItem('lana_session') && !document.getElementById('password_baru'), 'terkunci (429) -> pesan tampil, tetap login, form baru tetap tertutup');
passwordSrv.terkunci = false;

await isi(document.getElementById('password_lama'), 'Kucing#2026');
await submit(formLama()); await tunggu(80);
cek(!!document.getElementById('password_baru') && !!document.getElementById('password_konfirmasi') && teks().includes('Password lama terverifikasi'), 'password lama benar -> form password baru terbuka');
cek(!document.getElementById('password_lama') && document.activeElement?.id === 'password_baru', 'kolom password lama diganti ringkasan; fokus pindah ke password baru');
cek(!!document.querySelector('.ganti-pw .pw-meter') && teks().includes('Kekuatan password'), 'meter kekuatan & daftar aturan tampil');

const formBaru = () => document.getElementById('password_baru').closest('form');
await submit(formBaru());
cek(teks().includes('Password wajib diisi.') && teks().includes('Konfirmasi password wajib diisi.') && !log.includes('PUT /auth/password'), 'form baru kosong -> alasan error, tidak ada PUT');

await isi(document.getElementById('password_baru'), 'lemah');
await submit(formBaru());
cek(teks().includes('terlalu pendek') && teks().includes('huruf kapital') && teks().includes('angka') && teks().includes('simbol'), 'password lemah -> semua alasan tampil sekaligus');

await isi(document.getElementById('password_baru'), 'Kucing#2026');
await isi(document.getElementById('password_konfirmasi'), 'Kucing#2026');
await submit(formBaru());
cek(teks().includes('Password baru tidak boleh sama dengan password lama') && !log.includes('PUT /auth/password'), 'password baru = password lama -> ditolak di browser');

await isi(document.getElementById('password_baru'), 'Anjing#2027');
await isi(document.getElementById('password_konfirmasi'), 'Anjing#2028');
await submit(formBaru());
cek(teks().includes('Konfirmasi password tidak sama') && !log.includes('PUT /auth/password'), 'konfirmasi tidak sama -> ditolak di browser');

await klik(tombol('Batal', document.querySelector('.ganti-pw')));
cek(!!document.getElementById('password_lama') && document.getElementById('password_lama').value === '' && !document.getElementById('password_baru'), 'Batal -> kembali ke langkah 1, isian dikosongkan');

// langkah 2 gagal 403 (password lama berubah di tempat lain) -> kembali ke langkah 1
await isi(document.getElementById('password_lama'), 'Kucing#2026');
await submit(formLama()); await tunggu(80);
passwordSrv.sekarang = 'DiGantiLain#9';
await isi(document.getElementById('password_baru'), 'Anjing#2027');
await isi(document.getElementById('password_konfirmasi'), 'Anjing#2027');
await submit(formBaru()); await tunggu(100);
cek(!!document.getElementById('password_lama') && teks().includes('Password lama salah') && !!sessionStorage.getItem('lana_session'), 'PUT 403 -> kembali ke langkah 1 dengan pesan, pengguna tetap login');
passwordSrv.sekarang = 'Kucing#2026';

// jalur sukses
await isi(document.getElementById('password_lama'), 'Kucing#2026');
await submit(formLama()); await tunggu(80);
await isi(document.getElementById('password_baru'), 'Anjing#2027');
await isi(document.getElementById('password_konfirmasi'), 'Anjing#2027');
await submit(formBaru()); await tunggu(150);
cek(log.includes('PUT /auth/password') && JSON.stringify(lastPassword) === JSON.stringify({ password_lama: 'Kucing#2026', password_baru: 'Anjing#2027' }), 'body PUT: hanya password_lama + password_baru (tanpa konfirmasi)');
cek(passwordSrv.sekarang === 'Anjing#2027', 'server menerima password baru');
cek(sessionStorage.getItem('lana_session') === null && !!document.getElementById('username') && !document.querySelector('.ganti-pw'), 'berhasil -> sesi dihapus, kembali ke halaman login');
cek(teks().includes('Password berhasil diubah. Silakan login dengan password baru.'), 'notifikasi sukses tampil di halaman login');
cek(log.includes('POST /auth/logout'), 'token lama dicabut (logout dipanggil, hasilnya diabaikan)');
root.unmount();

console.log('GANTI PASSWORD: aturan khusus');
reset(); sesi('CUSTOMER');
{ const s = JSON.parse(sessionStorage.getItem('lana_session')); s.user.username = 'budisantoso'; sessionStorage.setItem('lana_session', JSON.stringify(s)); }
root = await buka('/profil');
await isi(document.getElementById('password_lama'), 'Kucing#2026');
await submit(formLama()); await tunggu(80);
await isi(document.getElementById('password_baru'), 'Budisantoso#1A');
await isi(document.getElementById('password_konfirmasi'), 'Budisantoso#1A');
await submit(formBaru());
cek(teks().includes('tidak boleh mengandung username') && !log.includes('PUT /auth/password'), 'password memuat username -> ditolak');
await isi(document.getElementById('password_baru'), 'Aman#Sekali99');
cek([...document.querySelectorAll('.pw-checklist li')].every((li) => li.classList.contains('ok')) && teks().includes('Sangat kuat'), 'semua aturan terpenuhi -> checklist hijau semua, kekuatan "Sangat kuat"');
root.unmount();

console.log('GANTI PASSWORD: admin & halaman profil lain tetap normal');
reset(); sesi('ADMIN');
root = await buka('/profil');
cek(!!document.getElementById('password_lama') && !!document.getElementById('alamat') && !!document.getElementById('username'), 'admin: ganti password tersedia bersama form profil');
cek(document.querySelectorAll('form').length === 2 && document.querySelector('form').id !== 'x' && !!document.querySelector('form.profil'), 'dua form terpisah (profil dan ganti password), tidak bersarang');
await isi(document.getElementById('alamat'), 'Jl. Kantor Pusat No. 5, Bandung');
await submit(document.querySelector('form.profil')); await tunggu(100);
cek(lastPatch.alamat === 'Jl. Kantor Pusat No. 5, Bandung' && !log.some((l) => l.includes('/auth/password')), 'menyimpan profil tidak menyentuh endpoint password');
root.unmount();

await vite.close();
console.log(gagal ? `\n${gagal} GAGAL` : '\nSEMUA LULUS');
process.exit(gagal ? 1 : 0);
