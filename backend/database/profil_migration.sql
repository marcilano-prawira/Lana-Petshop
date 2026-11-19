-- Jalankan sekali (aman diulang):
--   psql -U postgres -d lana_petshop -f database/profil_migration.sql
-- (di Supabase: tempel di SQL Editor lalu Run)

-- Foto profil semua role, disimpan sebagai data URL (JPEG kecil, ± 30-80 KB).
ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_profil TEXT;

-- Customer sudah punya customer.alamat_customer. Admin belum punya kolom alamat.
ALTER TABLE admin ADD COLUMN IF NOT EXISTS alamat_admin TEXT;

-- Ganti password: waktu terakhir password diubah. Token yang diterbitkan SEBELUM waktu ini
-- ditolak, sehingga semua sesi lama otomatis berakhir setelah password diganti.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_diubah_at TIMESTAMPTZ;
