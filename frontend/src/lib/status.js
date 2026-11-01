import { hitungTotalHotel } from './hotel.js';

// Total harga satu pesanan (sama dengan Pesanan.hitungTotal di backend).
export function totalPesanan(p) {
  if (p.jenis_pesanan === 'GROOMING') return Math.round(Number(p.harga_paket) || 0);
  return hitungTotalHotel(p.jam_checkin, p.jam_checkout, p.tarif_per_hari);
}

// Menggabungkan status pesanan + status pembayaran menjadi satu keadaan
// yang mudah dipahami pelanggan, lengkap dengan aksi yang diperbolehkan.
//   pesanan.status_pesanan:        MENUNGGU | DIPROSES | SELESAI | DIBATALKAN
//   pembayaran.status_pembayaran:  MENUNGGU | TERVERIFIKASI | DITOLAK  (atau tidak ada)
export function statusGabungan(pesanan, pembayaran) {
  const sp = pesanan.status_pesanan;
  const sb = pembayaran?.status_pembayaran;

  if (sp === 'DIBATALKAN') {
    return { kode: 'dibatalkan', label: 'Dibatalkan', tone: 'muted', bisaBayar: false, bisaBatal: false };
  }
  if (sp === 'SELESAI') {
    return { kode: 'selesai', label: 'Selesai', tone: 'ok', bisaBayar: false, bisaBatal: false };
  }
  if (sp === 'DIPROSES' || sb === 'TERVERIFIKASI') {
    return { kode: 'diproses', label: 'Pembayaran terverifikasi · Diproses', tone: 'ok', bisaBayar: false, bisaBatal: false };
  }
  if (sb === 'MENUNGGU') {
    return {
      kode: 'verifikasi',
      label: 'Menunggu verifikasi admin',
      tone: 'info',
      bisaBayar: false,
      bisaBatal: false,
      alasanTidakBisaBatal: 'Tidak dapat dibatalkan saat bukti pembayaran sedang diverifikasi admin.',
    };
  }
  if (sb === 'DITOLAK') {
    return { kode: 'ditolak', label: 'Pembayaran ditolak · Kirim ulang bukti', tone: 'danger', bisaBayar: true, bisaBatal: true };
  }
  return { kode: 'belum_bayar', label: 'Menunggu pembayaran', tone: 'warn', bisaBayar: true, bisaBatal: true };
}

export const LABEL_PEMBAYARAN = {
  MENUNGGU: { label: 'Menunggu verifikasi', tone: 'info' },
  TERVERIFIKASI: { label: 'Terverifikasi', tone: 'ok' },
  DITOLAK: { label: 'Ditolak', tone: 'danger' },
};

export function ringkasLayanan(p) {
  return p.jenis_pesanan === 'GROOMING' ? `Grooming · ${p.nama_layanan}` : 'Pet Hotel';
}
