CREATE EXTENSION IF NOT EXISTS pgcrypto;
 
-- =====================================================
-- 1. ADMIN  (users -> pegawai -> admin)
--    username: admin | password: admin123
-- =====================================================
INSERT INTO users (username, password, role, jenis_kelamin)
VALUES ('admin', crypt('admin123', gen_salt('bf', 10)), 'ADMIN', 'P')
ON CONFLICT (username) DO NOTHING;
 
INSERT INTO pegawai (id_user, jabatan)
SELECT id_user, 'Kasir' FROM users WHERE username = 'admin'
ON CONFLICT (id_user) DO NOTHING;
 
INSERT INTO admin (id_user, nama_admin, email_admin)
SELECT id_user, 'Admin Lana', 'admin@lanapetshop.com' FROM users WHERE username = 'admin'
ON CONFLICT (id_user) DO NOTHING;
 
-- =====================================================
-- 2. CUSTOMER  (users -> customer)
--    username: budi  | password: customer123
--    username: sari  | password: customer123
-- =====================================================
INSERT INTO users (username, password, role, jenis_kelamin) VALUES
('budi', crypt('customer123', gen_salt('bf', 10)), 'CUSTOMER', 'L'),
('sari', crypt('customer123', gen_salt('bf', 10)), 'CUSTOMER', 'P')
ON CONFLICT (username) DO NOTHING;
 
INSERT INTO customer (id_user, nama_customer, alamat_customer, no_hp_customer)
SELECT id_user, 'Budi Santoso', 'Jl. Dago No. 10, Bandung', '081234567890'
FROM users WHERE username = 'budi'
ON CONFLICT (id_user) DO NOTHING;
 
INSERT INTO customer (id_user, nama_customer, alamat_customer, no_hp_customer)
SELECT id_user, 'Sari Wulandari', 'Jl. Setiabudi No. 25, Bandung', '081298765432'
FROM users WHERE username = 'sari'
ON CONFLICT (id_user) DO NOTHING;
 
-- =====================================================
-- 3. PET milik customer (customer belum punya fitur tambah pet)
-- =====================================================
INSERT INTO pet (id_user, nama_pet, jenis_pet, ras_hewan, usia, berat, alergi)
SELECT u.id_user, 'Mochi', 'Kucing', 'Persia', 2, 4, '-'
FROM users u WHERE u.username = 'budi'
  AND NOT EXISTS (SELECT 1 FROM pet p WHERE p.id_user = u.id_user AND p.nama_pet = 'Mochi');
 
INSERT INTO pet (id_user, nama_pet, jenis_pet, ras_hewan, usia, berat, alergi)
SELECT u.id_user, 'Bruno', 'Anjing', 'Golden Retriever', 3, 25, 'Alergi ayam'
FROM users u WHERE u.username = 'budi'
  AND NOT EXISTS (SELECT 1 FROM pet p WHERE p.id_user = u.id_user AND p.nama_pet = 'Bruno');
 
INSERT INTO pet (id_user, nama_pet, jenis_pet, ras_hewan, usia, berat, alergi)
SELECT u.id_user, 'Luna', 'Kucing', 'Anggora', 1, 3, '-'
FROM users u WHERE u.username = 'sari'
  AND NOT EXISTS (SELECT 1 FROM pet p WHERE p.id_user = u.id_user AND p.nama_pet = 'Luna');
 
-- =====================================================
-- 4. PAKET GROOMING (dibuat oleh admin)
-- =====================================================
INSERT INTO paket_grooming (id_user, nama_layanan, detail_layanan, jenis_paket, harga_paket)
SELECT a.id_user, v.nama, v.detail, v.jenis, v.harga
FROM (SELECT id_user FROM users WHERE username = 'admin') a
CROSS JOIN (VALUES
    ('Grooming Basic',     'Mandi, keringkan, sisir bulu',                       'Basic',   50000),
    ('Grooming Lengkap',   'Mandi, potong bulu, potong kuku, bersih telinga',    'Premium', 100000),
    ('Grooming Anti Kutu', 'Mandi obat anti kutu dan jamur, keringkan, sisir',   'Premium', 120000),
    ('Grooming Spa',       'Mandi, pijat relaksasi, masker bulu, parfum hewan',  'Deluxe',  150000)
) AS v(nama, detail, jenis, harga)
WHERE NOT EXISTS (SELECT 1 FROM paket_grooming pg WHERE pg.nama_layanan = v.nama);
 
-- =====================================================
-- 5. VERIFIKASI
-- =====================================================
\echo '--- USERS ---'
SELECT u.id_user, u.username, u.role, COALESCE(c.nama_customer, a.nama_admin) AS nama
FROM users u
LEFT JOIN customer c ON c.id_user = u.id_user
LEFT JOIN admin a ON a.id_user = u.id_user
ORDER BY u.id_user;
 
\echo '--- PET ---'
SELECT p.id_pet, p.nama_pet, p.jenis_pet, c.nama_customer
FROM pet p JOIN customer c ON c.id_user = p.id_user
ORDER BY p.id_pet;
 
\echo '--- PAKET GROOMING ---'
SELECT id_layanan, nama_layanan, jenis_paket, harga_paket FROM paket_grooming ORDER BY id_layanan;