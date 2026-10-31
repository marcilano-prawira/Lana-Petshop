# Kontrak API frontend ↔ backend

Dokumen ini merangkum apa yang dipakai frontend dan apa yang masih perlu disiapkan
di backend. **Belum ada perubahan database** — fokus saat ini frontend dulu.

## 1. Endpoint backend yang sudah ada dan dipakai

| Fitur | Endpoint |
|---|---|
| Login / registrasi / logout | `POST /auth/login`, `/auth/registrasi`, `/auth/logout` |
| Paket grooming | `GET /paket-grooming` |
| Hewan milik pelanggan | `GET /pesanan/pet-saya` |
| Buat pesanan | `POST /pesanan/grooming`, `POST /pesanan/hotel` |
| Daftar / detail / batal pesanan | `GET /pesanan`, `GET /pesanan/:id`, `PATCH /pesanan/:id/batal` |
| Kirim bukti bayar (juga kirim ulang jika ditolak) | `POST /pembayaran` |
| Daftar pembayaran | `GET /pembayaran` (customer: miliknya, admin: semua) |
| Verifikasi admin | `PATCH /pembayaran/:id/verifikasi` dengan `{ "status_pembayaran": "TERVERIFIKASI" \| "DITOLAK" }` |
| Progres pesanan | `GET /progress/pesanan/:id` |

## 2. Format foto bukti pembayaran

Frontend mengirim foto di field `bukti_pembayaran` sebagai **data URL JPEG**:

```
"bukti_pembayaran": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
```

- Foto divalidasi lewat isi file (bukan ekstensi): hanya JPG/PNG/WEBP, maks. 10 MB, sisi terpendek minimal 200 px.
- Sebelum dikirim foto dikecilkan (sisi terpanjang maks. 1280 px) dan dikompres JPEG,
  targetnya ≤ ~350 KB, jadi string base64-nya ≈ 470 KB.
- Saat menampilkan, frontend menerima tiga bentuk nilai `bukti_pembayaran`:
  data URL (sekarang), **URL/path file** (jika nanti foto disimpan sebagai file di server),
  atau teks biasa (data lama; ditampilkan sebagai teks). Jadi perpindahan ke penyimpanan
  file nanti tidak perlu mengubah frontend.

## 3. Yang perlu disiapkan di backend (agar upload foto berjalan)

1. **Batas ukuran request.** `app.js` memakai `express.json()` dengan batas bawaan 100 KB,
   sehingga foto akan ditolak (HTTP 413). Ubah menjadi:
   ```js
   app.use(express.json({ limit: '2mb' }));
   ```
2. **Tipe kolom `pembayaran.bukti_pembayaran`.** Harus `TEXT` (bukan `VARCHAR(255)`)
   agar muat data URL. Alternatif untuk nanti: simpan sebagai file/`BYTEA`, dan isi kolom
   dengan URL file tersebut.
3. **Tambah hewan** (belum ada di backend): halaman *Hewan Saya* memanggil
   ```
   POST /pesanan/pet-saya
   { "nama_pet": "Mochi", "jenis_pet": "Kucing", "ras_pet": "Persia" | null }
   → 201 { success: true, message, data: { id_pet, nama_pet, ... } }
   ```
   `id_user` diambil dari token (`req.user`), bukan dari body. Sesuaikan nama kolom
   `jenis_pet` / `ras_pet` dengan tabel `pet` yang sebenarnya.

## 4. Celah yang ditemukan di logika backend (disarankan diperbaiki)

- **Pembatalan saat bukti sedang diverifikasi.** `PATCH /pesanan/:id/batal` hanya mengecek
  `status_pesanan = MENUNGGU`, dan `verifikasi` tidak mengecek apakah pesanannya sudah
  dibatalkan. Akibatnya admin bisa memverifikasi pembayaran untuk pesanan yang sudah
  dibatalkan dan statusnya berubah lagi menjadi `DIPROSES`. Frontend sudah menyembunyikan
  tombol batal saat pembayaran `MENUNGGU`, tetapi backend tetap perlu menolaknya.
- **Alasan penolakan.** Backend belum menyimpan alasan saat admin menolak; pelanggan hanya
  melihat progres "Pembayaran Ditolak". Bila ingin ada alasan, tambahkan field `alasan` pada
  `PATCH /pembayaran/:id/verifikasi` dan kolomnya di tabel.
- **Ukuran respons.** `GET /pembayaran` mengembalikan semua foto sekaligus. Ini aman untuk
  data sedikit, tetapi nanti sebaiknya daftar hanya memuat metadata dan foto diambil per
  pembayaran (atau berupa URL file).

## 5. Pengaturan frontend

`src/config.js`: `METODE_BAYAR` (pilihan metode), `INFO_PEMBAYARAN` (instruksi/rekening
toko yang tampil di halaman bayar — **kosong, isi sesuai data toko**), `JENIS_HEWAN`.
