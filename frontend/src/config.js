// Semua pengaturan penting ada di sini supaya mudah diubah.

export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// Batas waktu sesi di halaman Home (dihitung sejak login). Default: 2 jam.
export const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

// Peringatan muncul ketika sisa waktu sesi tinggal sekian menit.
export const SESSION_WARNING_MS = 5 * 60 * 1000;

// Pembatasan percobaan login yang gagal (di sisi browser).
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MS = 60 * 1000;

// Tarif pet hotel per hari. HANYA untuk perkiraan di form; angka final
// dihitung server (env HOTEL_TARIF_PER_HARI di backend, default 75000).
export const HOTEL_TARIF_PER_HARI = Number(import.meta.env.VITE_HOTEL_TARIF_PER_HARI) || 75000;

// Metode pembayaran yang bisa dipilih pelanggan (maks. 30 karakter, aturan backend).
export const METODE_BAYAR = ['Transfer Bank', 'QRIS', 'E-Wallet'];

// Instruksi pembayaran yang ditampilkan di halaman bayar. ISI SESUAI DATA TOKO.
// Contoh: { metode: 'Transfer Bank', keterangan: 'BCA 1234567890 a.n. Lana Petshop' }
// Dibiarkan kosong = tidak ada kotak instruksi yang ditampilkan.
export const INFO_PEMBAYARAN = [];

// Jenis hewan yang bisa dipilih saat mendaftarkan hewan.
export const JENIS_HEWAN = ['Kucing', 'Anjing', 'Kelinci', 'Hamster', 'Burung', 'Lainnya'];

// Saran jenis paket grooming (admin tetap boleh mengetik jenis lain, maks. 50 karakter).
export const JENIS_PAKET = ['Basic', 'Premium', 'Deluxe'];

// Saran status progres saat admin memperbarui layanan (maks. 30 karakter, boleh diketik bebas).
// "Selesai" menutup pesanan.
export const SARAN_PROGRESS = {
  GROOMING: ['Sedang Dimandikan', 'Sedang Dikeringkan', 'Sedang Dirapikan', 'Siap Dijemput', 'Selesai'],
  HOTEL: ['Hewan Check-in', 'Sedang Dirawat', 'Siap Dijemput', 'Selesai'],
};
