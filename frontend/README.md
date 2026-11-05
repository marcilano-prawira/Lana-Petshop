# Lana Petshop – Frontend (React + Vite)

Halaman pelanggan: **Login**, **Registrasi** (tanpa email), **Home**, **Pesan Grooming**, **Pesan Pet Hotel**, **Hewan Saya**, **Pesanan Saya** (termasuk progres), **Bayar** (upload bukti), **Data Pet Hotel**.

Halaman admin: **Verifikasi Pembayaran**, **Semua Pesanan** (+ update progres), **Paket Grooming** (tambah/ubah/hapus), **Data Pet Hotel** (lihat/ubah/hapus), **Laporan** bulanan. Khusus desktop.

| Rute | Siapa | Fungsi |
|---|---|---|
| `/admin/pembayaran` | Admin | Periksa foto bukti, terima / tolak |
| `/admin/pesanan` | Admin | Semua pesanan, riwayat progres, form update progres (`?tab=diproses` = pesanan yang bisa diupdate) |
| `/admin/paket` | Admin | Kelola paket grooming |
| `/admin/laporan` | Admin | Buat dan lihat laporan bulanan |
| `/pet-hotel` | Pelanggan & Admin | Pelanggan: detail miliknya. Admin: semua, plus ubah/hapus |

## Menjalankan
```bash
# 1. Jalankan backend dulu (port 3000)
cd ../backend && npm run dev

# 2. Jalankan frontend (port 5173)
cd ../frontend
npm install
npm run dev
```
Buka http://localhost:5173. Request ke `/api` otomatis diteruskan ke backend.

## Pengaturan penting (`src/config.js`)
- `SESSION_DURATION_MS` – batas sesi di Home (default 2 jam sejak login)
- `SESSION_WARNING_MS` – peringatan sebelum sesi habis (default 5 menit)
- `HOTEL_TARIF_PER_HARI` – hanya untuk perkiraan biaya hotel di form (samakan dengan `HOTEL_TARIF_PER_HARI` di backend; total final dihitung server)
- `MAX_LOGIN_ATTEMPTS` / `LOCKOUT_MS` – batas gagal login (5x → kunci 60 detik)

## Tes
```bash
npm run test:validasi   # aturan validasi (cepat)
npm run test:e2e        # alur lengkap di jsdom dengan backend tiruan
npm test                # keduanya
```

## Alur pembayaran
1. Customer membuat pesanan → **Bayar sekarang** → pilih metode, unggah foto bukti.
2. Status menjadi *Menunggu verifikasi admin*. Admin membuka **Verifikasi Pembayaran**,
   memeriksa foto, lalu **Terima** (pesanan diproses) atau **Tolak**.
3. Jika ditolak, customer wajib **kirim ulang** foto bukti dari halaman Pesanan Saya.

Detail endpoint, format foto, dan hal yang perlu disiapkan di backend: lihat **KONTRAK-API.md**.

## Catatan pemesanan
- Pesanan hanya untuk akun `CUSTOMER` dan memakai hewan dari `GET /pesanan/pet-saya`.
- Halaman *Hewan Saya* memakai `POST /pesanan/pet-saya` yang **belum ada** di backend
  (lihat KONTRAK-API.md). Sebelum endpoint itu dibuat, hewan perlu dimasukkan lewat database.
- Aturan jadwal hotel (di frontend): check-in tidak boleh lewat & maks. 90 hari ke depan,
  durasi 1 jam – 30 hari. Diatur di `BATAS_HOTEL` pada `src/lib/validators.js`.
