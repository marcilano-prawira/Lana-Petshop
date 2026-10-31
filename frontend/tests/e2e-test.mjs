import { JSDOM } from 'jsdom';
import { File as NodeFile } from 'node:buffer';
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
const { window } = dom;
for (const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLCanvasElement','Node','Event','MouseEvent','sessionStorage','localStorage','getComputedStyle','requestAnimationFrame','cancelAnimationFrame','FileReader']) {
  try { Object.defineProperty(globalThis, k, { value: window[k], configurable: true, writable: true }); } catch {}
}
window.scrollTo = () => {};
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
let pets, pesanan, pembayaran, progress, log, petEndpointAda;
function reset() {
  petEndpointAda = true; log = [];
  pets = [{ id_pet: 1, nama_pet: 'Mochi', jenis_pet: 'Kucing' }];
  const dasar = { id_user: 5, nama_customer: 'Zain', nama_pet: 'Mochi', tanggal_pesanan: iso(-5), jenis_pesanan: 'GROOMING', nama_layanan: 'Full Grooming', harga_paket: '120000.00' };
  pesanan = [
    { ...dasar, id_pesanan: 1, status_pesanan: 'MENUNGGU' },
    { ...dasar, id_pesanan: 2, status_pesanan: 'MENUNGGU' },
    { ...dasar, id_pesanan: 3, status_pesanan: 'MENUNGGU' },
    { ...dasar, id_pesanan: 4, status_pesanan: 'DIPROSES' },
    { ...dasar, id_pesanan: 5, jenis_pesanan: 'HOTEL', nama_layanan: null, harga_paket: null, jam_checkin: iso(24), jam_checkout: iso(24 + 72), tarif_per_hari: '75000.00', status_pesanan: 'MENUNGGU' },
  ];
  const foto = 'data:image/jpeg;base64,/9j/AAAA';
  pembayaran = [
    { id_pembayaran: 11, id_pesanan: 2, id_user: 5, nama_customer: 'Zain', total_harga: '120000.00', metode_pembayaran: 'QRIS', bukti_pembayaran: foto, status_pembayaran: 'DITOLAK', tanggal_bayar: iso(-3) },
    { id_pembayaran: 12, id_pesanan: 3, id_user: 5, nama_customer: 'Zain', total_harga: '120000.00', metode_pembayaran: 'Transfer Bank', bukti_pembayaran: foto, status_pembayaran: 'MENUNGGU', tanggal_bayar: iso(-2) },
    { id_pembayaran: 13, id_pesanan: 4, id_user: 5, nama_customer: 'Zain', total_harga: '120000.00', metode_pembayaran: 'QRIS', bukti_pembayaran: foto, status_pembayaran: 'TERVERIFIKASI', tanggal_bayar: iso(-4), tanggal_verifikasi: iso(-3) },
  ];
  progress = { 4: [{ id_progress: 2, status_progress: 'Pembayaran Terverifikasi', keterangan: 'Pesanan akan segera diproses', updated_at: iso(-3) }, { id_progress: 1, status_progress: 'Menunggu Pembayaran', keterangan: 'Pesanan grooming berhasil dibuat', updated_at: iso(-5) }] };
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
  if ((m = path.match(/^\/pesanan\/(\d+)$/)) && method === 'GET') { const p = pesanan.find((x) => x.id_pesanan == m[1]); return p ? res(200, { ...p, total_harga: total(p) }) : res(404, null, 'Pesanan tidak ditemukan'); }
  if ((m = path.match(/^\/pesanan\/(\d+)\/batal$/))) { const p = pesanan.find((x) => x.id_pesanan == m[1]); p.status_pesanan = 'DIBATALKAN'; return res(200, p); }
  if (path === '/pesanan/pet-saya' && method === 'GET') return res(200, pets);
  if (path === '/pesanan/pet-saya' && method === 'POST') { if (!petEndpointAda) return res(404, null, 'Route tidak ditemukan'); pets.push({ id_pet: pets.length + 1, nama_pet: body.nama_pet, jenis_pet: body.jenis_pet, ras_pet: body.ras_pet }); return res(201, pets.at(-1)); }
  if (path === '/pembayaran' && method === 'GET') return res(200, pembayaran);
  if (path === '/pembayaran' && method === 'POST') {
    log.push(`BODY bukti=${String(body.bukti_pembayaran).slice(0, 22)} metode=${body.metode_pembayaran} id=${typeof body.id_pesanan}`);
    const ada = pembayaran.find((x) => x.id_pesanan === body.id_pesanan);
    if (ada && ada.status_pembayaran !== 'DITOLAK') return res(409, null, 'Pesanan ini sudah memiliki pembayaran');
    if (ada) Object.assign(ada, { metode_pembayaran: body.metode_pembayaran, bukti_pembayaran: body.bukti_pembayaran, status_pembayaran: 'MENUNGGU', tanggal_bayar: iso(0) });
    else pembayaran.push({ id_pembayaran: 20, id_pesanan: body.id_pesanan, id_user: 5, nama_customer: 'Zain', total_harga: '120000.00', metode_pembayaran: body.metode_pembayaran, bukti_pembayaran: body.bukti_pembayaran, status_pembayaran: 'MENUNGGU', tanggal_bayar: iso(0) });
    return res(201, {});
  }
  if ((m = path.match(/^\/pembayaran\/(\d+)\/verifikasi$/))) {
    const b = pembayaran.find((x) => x.id_pembayaran == m[1]);
    if (b.status_pembayaran !== 'MENUNGGU') return res(409, null, 'Pembayaran ini sudah diverifikasi sebelumnya');
    b.status_pembayaran = body.status_pembayaran; b.tanggal_verifikasi = iso(0);
    if (body.status_pembayaran === 'TERVERIFIKASI') pesanan.find((x) => x.id_pesanan === b.id_pesanan).status_pesanan = 'DIPROSES';
    return res(200, b);
  }
  if ((m = path.match(/^\/progress\/pesanan\/(\d+)$/))) return res(200, { riwayat: progress[m[1]] ?? [] });
  return res(404, null, 'tidak ada');
};

/* ---------------------------- pembantu ---------------------------- */
function sesi(role) {
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
const submit = (f) => act(async () => { f.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); });
const isi = (el, v) => act(async () => { const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set; set.call(el, v); el.dispatchEvent(new window.Event('input', { bubbles: true })); el.dispatchEvent(new window.Event('change', { bubbles: true })); });
const pilihFile = async (input, file) => { Object.defineProperty(input, 'files', { value: [file], configurable: true }); await act(async () => { input.dispatchEvent(new window.Event('change', { bubbles: true })); }); await tunggu(80); };
const jpg = (n = 3000, nama = 'bukti.jpg') => new NodeFile([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, ...new Array(n).fill(7)])], nama, { type: 'image/jpeg' });

/* ============================ SKENARIO ============================ */
console.log('PESANAN SAYA (customer)');
reset(); sesi('CUSTOMER');
let root = await buka('/pesanan');
let t = teks();
cek(t.includes('Menunggu pembayaran') && t.includes('Pembayaran ditolak · Kirim ulang bukti') && t.includes('Menunggu verifikasi admin') && t.includes('Pembayaran terverifikasi · Diproses'), '4 keadaan pesanan tampil dengan label berbeda');
cek(teks(document.querySelector('.tab-bar')).includes('Perlu tindakan 3'), 'tab "Perlu tindakan" = 3 (belum bayar, ditolak, hotel belum bayar)');
cek(document.querySelectorAll('a[href="/bayar/2"]')[0]?.textContent.includes('Kirim ulang bukti'), 'pesanan ditolak punya tombol "Kirim ulang bukti"');
cek(t.includes('Tidak dapat dibatalkan'), 'pesanan yang sedang diverifikasi tidak bisa dibatalkan');
cek(t.includes('225.000'), 'total hotel dihitung (3 hari x 75.000)');
await klik(tombol('Lihat progres', document.querySelectorAll('.pesanan')[3]));
await tunggu(60);
cek(teks().includes('Pembayaran Terverifikasi') && teks().includes('Pesanan grooming berhasil dibuat'), 'linimasa progres tampil');
await klik(tombol('Batalkan', document.querySelectorAll('.pesanan')[0]));
cek(teks(document.querySelector('.modal')).includes('Batalkan pesanan?'), 'konfirmasi batal muncul');
await klik(tombol('Ya, batalkan', document.querySelector('.modal')));
await tunggu(80);
cek(log.includes('PATCH /pesanan/1/batal') && teks().includes('berhasil dibatalkan') && !document.querySelector('.modal'), 'pesanan #1 dibatalkan lewat API, modal tertutup');
await klik([...document.querySelectorAll('.tab')].find((b) => b.textContent.startsWith('Dibatalkan')));
cek(teks().includes('Pesanan #1'), 'pesanan #1 pindah ke tab Dibatalkan');
root.unmount();

console.log('BAYAR (customer)');
reset(); sesi('CUSTOMER');
root = await buka('/bayar/1');
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
cek(log.includes('BODY bukti=data:image/jpeg;base64 metode=QRIS id=number'), 'body: bukti = data URL JPEG base64, metode benar, id_pesanan angka');
cek(teks().includes('Bukti pembayaran terkirim') && teks().includes('Menunggu verifikasi'), 'setelah kirim: status menunggu verifikasi admin');
cek(!document.querySelector('form'), 'form upload hilang (tidak bisa kirim dobel)');
root.unmount();

console.log('KIRIM ULANG setelah ditolak');
reset(); sesi('CUSTOMER');
root = await buka('/bayar/2');
cek(teks().includes('Pembayaran sebelumnya ditolak admin') && teks().includes('Kirim ulang bukti') && teks().includes('Bukti sebelumnya (ditolak)'), 'banner ditolak + form kirim ulang + bukti lama');
await pilihFile(document.getElementById('bukti'), jpg(4000, 'baru.jpg'));
await klik(document.querySelector('input[name="metode"][value="Transfer Bank"]'));
await submit(document.querySelector('form')); await tunggu(120);
cek(pembayaran.find((b) => b.id_pesanan === 2).status_pembayaran === 'MENUNGGU' && teks().includes('Menunggu admin memeriksa'), 'kirim ulang -> status kembali MENUNGGU');
root.unmount();
root = await buka('/bayar/3');
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
cek(log.includes('PATCH /pembayaran/12/verifikasi') && pembayaran.find((b) => b.id_pembayaran === 12).status_pembayaran === 'TERVERIFIKASI' && pesanan.find((p) => p.id_pesanan === 3).status_pesanan === 'DIPROSES', 'diverifikasi -> pembayaran TERVERIFIKASI & pesanan DIPROSES');
cek(!document.querySelector('.modal') && teks().includes('diverifikasi'), 'modal tertutup + notifikasi sukses');
root.unmount();

reset(); pembayaran.push({ ...pembayaran[1], id_pembayaran: 14, id_pesanan: 1, status_pembayaran: 'MENUNGGU' });
root = await buka('/admin/pembayaran');
await klik(tombol('Periksa')); await tunggu(80);
await klik(tombol('Tolak', document.querySelector('.modal')));
cek(teks(document.querySelector('.modal')).includes('wajib mengirim ulang'), 'tolak: konfirmasi menyebut pelanggan wajib kirim ulang');
await klik(tombol('Ya, tolak', document.querySelector('.modal'))); await tunggu(100);
cek(pembayaran.find((b) => b.id_pembayaran === 12).status_pembayaran === 'DITOLAK' || pembayaran.some((b) => b.status_pembayaran === 'DITOLAK' && b.id_pembayaran !== 11), 'pembayaran berstatus DITOLAK di server');
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

await vite.close();
console.log(gagal ? `\n${gagal} GAGAL` : '\nSEMUA LULUS');
process.exit(gagal ? 1 : 0);
