import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validasiUsername,
  validasiPasswordLogin,
  validasiPasswordRegistrasi,
  validasiKonfirmasiPassword,
  validasiNama,
  validasiNoHp,
  validasiJenisKelamin,
  validasiAlamat,
  skorPassword,
} from './validators.js';

const ada = (arr, teks) => arr.some((a) => a.includes(teks));

test('username: kosong', () => assert.deepEqual(validasiUsername(''), ['Username wajib diisi.']));
test('username: spasi di tengah', () => assert.ok(ada(validasiUsername('zain satrio'), 'mengandung spasi')));
test('username: spasi di ujung', () => assert.ok(ada(validasiUsername(' zain'), 'diawali atau diakhiri spasi')));
test('username: kapital disebutkan', () => {
  const r = validasiUsername('ZainA');
  assert.ok(ada(r, 'huruf kecil semua'));
  assert.ok(ada(r, '"Z"'));
});
test('username: karakter terlarang disebutkan', () => {
  const r = validasiUsername('zain@sa-trio');
  assert.ok(ada(r, '"@"') && ada(r, '"-"'));
});
test('username: pendek dan panjang', () => {
  assert.ok(ada(validasiUsername('abc'), 'terlalu pendek (3'));
  assert.ok(ada(validasiUsername('a'.repeat(51)), 'terlalu panjang (51'));
});
test('username: valid', () => {
  assert.deepEqual(validasiUsername('zain_satrio.01'), []);
  assert.deepEqual(validasiUsername('admin'), []);
});
test('username: aturan tambahan hanya saat registrasi', () => {
  assert.ok(ada(validasiUsername('_zain', { mode: 'register' }), 'diawali atau diakhiri titik'));
  assert.ok(ada(validasiUsername('za..in', { mode: 'register' }), 'berurutan'));
  assert.ok(ada(validasiUsername('123456', { mode: 'register' }), 'minimal satu huruf'));
  assert.deepEqual(validasiUsername('_zain', { mode: 'login' }), []);
});
test('username: emoji / unicode dilaporkan', () => {
  assert.ok(ada(validasiUsername('zainé🐶'), 'tidak diperbolehkan'));
});

test('password login: aturan backend', () => {
  assert.deepEqual(validasiPasswordLogin(''), ['Password wajib diisi.']);
  assert.ok(ada(validasiPasswordLogin('abc'), 'Minimal 6'));
  assert.ok(ada(validasiPasswordLogin('a'.repeat(73)), 'Maksimal 72'));
  assert.deepEqual(validasiPasswordLogin('abcdef'), []);
});
test('password registrasi: ketat', () => {
  const r = validasiPasswordRegistrasi('abc');
  assert.ok(ada(r, 'Minimal 8') && ada(r, 'kapital') && ada(r, 'angka') && ada(r, 'simbol'));
  assert.ok(ada(validasiPasswordRegistrasi('Ab1!Ab1! x'), 'spasi'));
  assert.ok(ada(validasiPasswordRegistrasi('Zainsatrio1!', 'zainsatrio'), 'mengandung username'));
  assert.ok(ada(validasiPasswordRegistrasi('Aaaaa1!bc'), 'berulang'));
  assert.deepEqual(validasiPasswordRegistrasi('Kucing#2026', 'zain'), []);
});
test('konfirmasi password', () => {
  assert.ok(ada(validasiKonfirmasiPassword('a', ''), 'wajib'));
  assert.ok(ada(validasiKonfirmasiPassword('a', 'b'), 'tidak sama'));
  assert.deepEqual(validasiKonfirmasiPassword('a', 'a'), []);
});
test('nama', () => {
  assert.ok(ada(validasiNama('Zain123'), 'angka'));
  assert.ok(ada(validasiNama('Zain@'), '"@"'));
  assert.ok(ada(validasiNama('Za'), 'terlalu pendek'));
  assert.ok(ada(validasiNama('Zain  Satrio'), 'spasi berurutan'));
  assert.deepEqual(validasiNama("Zain Satrio D'Arc-Putra Jr."), []);
  assert.deepEqual(validasiNama('Siti Nurhaliza'), []);
});
test('no hp', () => {
  assert.ok(ada(validasiNoHp('0812 3456 7890'), 'spasi'));
  assert.ok(ada(validasiNoHp('0812-3456'), 'tanda hubung'));
  assert.ok(ada(validasiNoHp('08ab123456'), 'hanya boleh berisi angka'));
  assert.ok(ada(validasiNoHp('0812345'), 'terlalu pendek'));
  assert.ok(ada(validasiNoHp('0812345678901234'), 'terlalu panjang'));
  assert.ok(ada(validasiNoHp('0212345678'), 'seluler Indonesia'));
  assert.deepEqual(validasiNoHp('081234567890'), []);
  assert.deepEqual(validasiNoHp('+6281234567890'), []);
});
test('jenis kelamin dan alamat', () => {
  assert.ok(ada(validasiJenisKelamin(''), 'wajib'));
  assert.deepEqual(validasiJenisKelamin('L'), []);
  assert.deepEqual(validasiAlamat(''), []);
  assert.ok(ada(validasiAlamat('Jl. A'), 'terlalu singkat'));
  assert.deepEqual(validasiAlamat('Jl. Terusan Jend. Sudirman No. 1, Cimahi'), []);
});
test('skor password', () => {
  assert.equal(skorPassword(''), 0);
  assert.equal(skorPassword('Kucing#2026'), 4);
});

import { validasiPilihan, validasiCheckin, validasiCheckout } from './validators.js';

test('pilihan wajib', () => {
  assert.ok(ada(validasiPilihan('', 'Hewan'), 'Hewan wajib dipilih'));
  assert.deepEqual(validasiPilihan(3, 'Hewan'), []);
});
test('check-in hotel', () => {
  const now = new Date('2026-11-01T10:00');
  assert.ok(ada(validasiCheckin('', now), 'wajib diisi'));
  assert.ok(ada(validasiCheckin('bukan-tanggal', now), 'tidak valid'));
  assert.ok(ada(validasiCheckin('2026-11-01T09:00', now), 'sudah lewat'));
  assert.deepEqual(validasiCheckin('2026-11-01T10:03', now), []); // dalam toleransi
  assert.ok(ada(validasiCheckin('2027-03-01T10:00', now), 'maksimal 90 hari'));
  assert.deepEqual(validasiCheckin('2026-11-05T09:00', now), []);
});
test('check-out hotel', () => {
  const masuk = '2026-11-05T09:00';
  assert.ok(ada(validasiCheckout(masuk, ''), 'wajib diisi'));
  assert.ok(ada(validasiCheckout(masuk, '2026-11-05T09:00'), 'harus setelah'));
  assert.ok(ada(validasiCheckout(masuk, '2026-11-04T09:00'), 'harus setelah'));
  assert.ok(ada(validasiCheckout(masuk, '2026-11-05T09:30'), 'minimal 1 jam'));
  assert.ok(ada(validasiCheckout(masuk, '2026-12-20T09:00'), 'maksimal 30 hari'));
  assert.deepEqual(validasiCheckout(masuk, '2026-11-08T09:00'), []);
  assert.deepEqual(validasiCheckout('', '2026-11-08T09:00'), []);
});

import { validasiNamaHewan, validasiJenisHewan, validasiRasHewan, validasiMetodeBayar } from './validators.js';
import { jenisDariBytes } from './gambar.js';
import { statusGabungan, totalPesanan } from './status.js';

test('nama, jenis, ras hewan', () => {
  assert.ok(ada(validasiNamaHewan(''), 'wajib'));
  assert.ok(ada(validasiNamaHewan('A'), 'terlalu pendek'));
  assert.ok(ada(validasiNamaHewan('Mochi@!'), '"@"'));
  assert.ok(ada(validasiNamaHewan('Mo  chi'), 'spasi berurutan'));
  assert.ok(ada(validasiNamaHewan('x'.repeat(51)), 'terlalu panjang'));
  assert.deepEqual(validasiNamaHewan("Mochi 2"), []);
  assert.ok(ada(validasiJenisHewan('', ['Kucing']), 'wajib'));
  assert.ok(ada(validasiJenisHewan('Naga', ['Kucing']), 'tidak dikenal'));
  assert.deepEqual(validasiJenisHewan('Kucing', ['Kucing']), []);
  assert.deepEqual(validasiRasHewan(''), []);
  assert.ok(ada(validasiRasHewan('Persia123'), 'huruf saja'));
});
test('metode bayar', () => {
  assert.ok(ada(validasiMetodeBayar('', ['QRIS']), 'wajib'));
  assert.deepEqual(validasiMetodeBayar('QRIS', ['QRIS']), []);
});
test('signature gambar', () => {
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
  const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0]);
  assert.equal(jenisDariBytes(jpg), 'JPG');
  assert.equal(jenisDariBytes(png), 'PNG');
  assert.equal(jenisDariBytes(webp), 'WEBP');
  assert.equal(jenisDariBytes(exe), null);
  assert.equal(jenisDariBytes(new Uint8Array([1, 2])), null);
});
test('status gabungan pesanan + pembayaran', () => {
  const p = (s) => ({ status_pesanan: s });
  const b = (s) => ({ status_pembayaran: s });
  assert.equal(statusGabungan(p('MENUNGGU'), null).kode, 'belum_bayar');
  assert.equal(statusGabungan(p('MENUNGGU'), null).bisaBayar, true);
  assert.equal(statusGabungan(p('MENUNGGU'), b('MENUNGGU')).kode, 'verifikasi');
  assert.equal(statusGabungan(p('MENUNGGU'), b('MENUNGGU')).bisaBatal, false);
  assert.equal(statusGabungan(p('MENUNGGU'), b('DITOLAK')).kode, 'ditolak');
  assert.equal(statusGabungan(p('MENUNGGU'), b('DITOLAK')).bisaBayar, true);
  assert.equal(statusGabungan(p('DIPROSES'), b('TERVERIFIKASI')).kode, 'diproses');
  assert.equal(statusGabungan(p('DIBATALKAN'), null).bisaBayar, false);
  assert.equal(statusGabungan(p('SELESAI'), b('TERVERIFIKASI')).kode, 'selesai');
});
test('total pesanan', () => {
  assert.equal(totalPesanan({ jenis_pesanan: 'GROOMING', harga_paket: '120000.00' }), 120000);
  assert.equal(totalPesanan({ jenis_pesanan: 'HOTEL', jam_checkin: '2026-11-05T09:00:00Z', jam_checkout: '2026-11-08T09:00:00Z', tarif_per_hari: '75000' }), 225000);
});
