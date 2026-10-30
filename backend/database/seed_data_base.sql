-- =====================================================
-- DATABASE LANA PETSHOP (PostgreSQL)
-- Jalankan: psql -U postgres -f seed_data_base.sql
-- =====================================================

DROP DATABASE IF EXISTS lana_petshop;
CREATE DATABASE lana_petshop;
\c lana_petshop

-- =====================================================
-- SEQUENCE untuk ID bertipe string (sesuai class diagram)
-- =====================================================
CREATE SEQUENCE seq_user START 1;
CREATE SEQUENCE seq_pet START 1;
CREATE SEQUENCE seq_layanan START 1;
CREATE SEQUENCE seq_pesanan START 1;
CREATE SEQUENCE seq_hotel START 1;
CREATE SEQUENCE seq_pembayaran START 1;
CREATE SEQUENCE seq_progress START 1;
CREATE SEQUENCE seq_laporan START 1;

-- =====================================================
-- 1. USER (induk)
-- =====================================================
CREATE TABLE users (
    id_user        VARCHAR(20) PRIMARY KEY
                   DEFAULT ('USR' || LPAD(nextval('seq_user')::text, 4, '0')),
    password       VARCHAR(255) NOT NULL,          -- simpan hasil hash
    role           VARCHAR(10)  NOT NULL CHECK (role IN ('CUSTOMER', 'ADMIN', 'PEGAWAI')),
    jenis_kelamin  CHAR(1)      CHECK (jenis_kelamin IN ('L', 'P')),
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. CUSTOMER (turunan User)  1 : 1
-- =====================================================
CREATE TABLE customer (
    id_user          VARCHAR(20) PRIMARY KEY,
    nama_customer    VARCHAR(100) NOT NULL,
    alamat_customer  TEXT,
    no_hp_customer   VARCHAR(20)  NOT NULL,
    CONSTRAINT fk_customer_user FOREIGN KEY (id_user)
        REFERENCES users (id_user) ON DELETE CASCADE
);

-- =====================================================
-- 3. PEGAWAI (turunan User)  1 : 1
-- =====================================================
CREATE TABLE pegawai (
    id_user  VARCHAR(20) PRIMARY KEY,
    jabatan  VARCHAR(50) NOT NULL,
    CONSTRAINT fk_pegawai_user FOREIGN KEY (id_user)
        REFERENCES users (id_user) ON DELETE CASCADE
);

-- =====================================================
-- 4. ADMIN / KASIR (turunan Pegawai)  1 : 1
-- =====================================================
CREATE TABLE admin (
    id_user      VARCHAR(20) PRIMARY KEY,
    nama_admin   VARCHAR(100) NOT NULL,
    email_admin  VARCHAR(100) NOT NULL UNIQUE,
    CONSTRAINT fk_admin_pegawai FOREIGN KEY (id_user)
        REFERENCES pegawai (id_user) ON DELETE CASCADE
);

-- =====================================================
-- 5. PET   (Customer 1 : n Pet)
-- =====================================================
CREATE TABLE pet (
    id_pet      VARCHAR(20) PRIMARY KEY
                DEFAULT ('PET' || LPAD(nextval('seq_pet')::text, 4, '0')),
    id_user     VARCHAR(20) NOT NULL,
    nama_pet    VARCHAR(100) NOT NULL,
    jenis_pet   VARCHAR(50)  NOT NULL,              -- kucing, anjing, dll.
    ras_hewan   VARCHAR(100),
    usia        INTEGER CHECK (usia >= 0),
    berat       INTEGER CHECK (berat > 0),
    alergi      TEXT,
    CONSTRAINT fk_pet_customer FOREIGN KEY (id_user)
        REFERENCES customer (id_user) ON DELETE CASCADE
);

-- =====================================================
-- 6. PAKET GROOMING / DAFTAR LAYANAN  (Admin 1 : n Paket)
-- =====================================================
CREATE TABLE paket_grooming (
    id_layanan      VARCHAR(20) PRIMARY KEY
                    DEFAULT ('LYN' || LPAD(nextval('seq_layanan')::text, 4, '0')),
    id_user         VARCHAR(20) NOT NULL,           -- admin pengelola
    nama_layanan    VARCHAR(100) NOT NULL,
    detail_layanan  TEXT,
    jenis_paket     VARCHAR(50)  NOT NULL,
    harga_paket     NUMERIC(12,2) NOT NULL CHECK (harga_paket >= 0),
    CONSTRAINT fk_paket_admin FOREIGN KEY (id_user)
        REFERENCES admin (id_user)
);

-- =====================================================
-- 7. PESANAN
--    Customer 1 : n Pesanan
--    Pesanan n : 0..1 Paket Grooming (diisi jika jenis = GROOMING)
-- =====================================================
CREATE TABLE pesanan (
    id_pesanan       VARCHAR(20) PRIMARY KEY
                     DEFAULT ('PSN' || LPAD(nextval('seq_pesanan')::text, 4, '0')),
    id_user          VARCHAR(20) NOT NULL,
    id_pet           VARCHAR(20) NOT NULL,
    id_layanan       VARCHAR(20),
    jenis_pesanan    VARCHAR(10) NOT NULL CHECK (jenis_pesanan IN ('GROOMING', 'HOTEL')),
    tanggal_pesanan  TIMESTAMP   NOT NULL DEFAULT NOW(),
    status_pesanan   VARCHAR(20) NOT NULL DEFAULT 'MENUNGGU'
                     CHECK (status_pesanan IN ('MENUNGGU', 'DIPROSES', 'SELESAI', 'DIBATALKAN')),
    CONSTRAINT fk_pesanan_customer FOREIGN KEY (id_user)
        REFERENCES customer (id_user),
    CONSTRAINT fk_pesanan_pet FOREIGN KEY (id_pet)
        REFERENCES pet (id_pet),
    CONSTRAINT fk_pesanan_layanan FOREIGN KEY (id_layanan)
        REFERENCES paket_grooming (id_layanan),
    -- grooming wajib punya layanan, hotel tidak boleh
    CONSTRAINT chk_pesanan_jenis CHECK (
        (jenis_pesanan = 'GROOMING' AND id_layanan IS NOT NULL) OR
        (jenis_pesanan = 'HOTEL'    AND id_layanan IS NULL)
    )
);

-- =====================================================
-- 8. PET HOTEL   (Pesanan 1 : 0..1 Pet Hotel)
-- =====================================================
CREATE TABLE pet_hotel (
    id_hotel        VARCHAR(20) PRIMARY KEY
                    DEFAULT ('HTL' || LPAD(nextval('seq_hotel')::text, 4, '0')),
    id_pesanan      VARCHAR(20) NOT NULL UNIQUE,
    jam_checkin     TIMESTAMP NOT NULL,
    jam_checkout    TIMESTAMP NOT NULL,
    tarif_per_hari  NUMERIC(12,2) NOT NULL CHECK (tarif_per_hari >= 0),
    CONSTRAINT fk_hotel_pesanan FOREIGN KEY (id_pesanan)
        REFERENCES pesanan (id_pesanan) ON DELETE CASCADE,
    CONSTRAINT chk_hotel_waktu CHECK (jam_checkout > jam_checkin)
);

-- =====================================================
-- 9. PEMBAYARAN   (Pesanan 1 : 1 Pembayaran)
-- =====================================================
CREATE TABLE pembayaran (
    id_pembayaran      VARCHAR(20) PRIMARY KEY
                       DEFAULT ('PAY' || LPAD(nextval('seq_pembayaran')::text, 4, '0')),
    id_pesanan         VARCHAR(20) NOT NULL UNIQUE,
    id_user            VARCHAR(20) NOT NULL,         -- customer pembayar
    total_harga        INTEGER NOT NULL CHECK (total_harga >= 0),
    metode_pembayaran  VARCHAR(30),
    bukti_pembayaran   TEXT,
    status_pembayaran  VARCHAR(20) NOT NULL DEFAULT 'MENUNGGU'
                       CHECK (status_pembayaran IN ('MENUNGGU', 'TERVERIFIKASI', 'DITOLAK')),
    tanggal_bayar      TIMESTAMP NOT NULL DEFAULT NOW(),
    diverifikasi_oleh  VARCHAR(20),                  -- admin / kasir
    tanggal_verifikasi TIMESTAMP,
    CONSTRAINT fk_bayar_pesanan FOREIGN KEY (id_pesanan)
        REFERENCES pesanan (id_pesanan),
    CONSTRAINT fk_bayar_customer FOREIGN KEY (id_user)
        REFERENCES customer (id_user),
    CONSTRAINT fk_bayar_admin FOREIGN KEY (diverifikasi_oleh)
        REFERENCES admin (id_user)
);

-- =====================================================
-- 10. PROGRESS LAYANAN   (Pesanan 1 : n Progress)
-- =====================================================
CREATE TABLE progress_layanan (
    id_progress      VARCHAR(20) PRIMARY KEY
                     DEFAULT ('PRG' || LPAD(nextval('seq_progress')::text, 4, '0')),
    id_pesanan       VARCHAR(20) NOT NULL,
    id_user          VARCHAR(20) NOT NULL,           -- customer pemilik pesanan
    status_progress  VARCHAR(30) NOT NULL,           -- mis. Menunggu, Dimandikan, Selesai
    keterangan       TEXT,
    updated_by       VARCHAR(20),                    -- admin yang mengubah
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_progress_pesanan FOREIGN KEY (id_pesanan)
        REFERENCES pesanan (id_pesanan) ON DELETE CASCADE,
    CONSTRAINT fk_progress_customer FOREIGN KEY (id_user)
        REFERENCES customer (id_user),
    CONSTRAINT fk_progress_admin FOREIGN KEY (updated_by)
        REFERENCES admin (id_user)
);

-- =====================================================
-- 11. LAPORAN LANAPETSHOP   (Admin 1 : n Laporan)
-- =====================================================
CREATE TABLE laporan_lanapetshop (
    id_laporan        VARCHAR(20) PRIMARY KEY
                      DEFAULT ('LAP' || LPAD(nextval('seq_laporan')::text, 4, '0')),
    id_user           VARCHAR(20) NOT NULL,          -- admin pembuat
    bulan             SMALLINT NOT NULL CHECK (bulan BETWEEN 1 AND 12),
    tahun             SMALLINT NOT NULL,
    total_pesanan     INTEGER       NOT NULL DEFAULT 0,
    total_pendapatan  NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_laporan_admin FOREIGN KEY (id_user)
        REFERENCES admin (id_user),
    CONSTRAINT uq_laporan_periode UNIQUE (bulan, tahun)
);

-- Detail laporan: pesanan apa saja yang masuk laporan (relasi n : n)
CREATE TABLE laporan_detail (
    id_laporan  VARCHAR(20) NOT NULL,
    id_pesanan  VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_laporan, id_pesanan),
    CONSTRAINT fk_detail_laporan FOREIGN KEY (id_laporan)
        REFERENCES laporan_lanapetshop (id_laporan) ON DELETE CASCADE,
    CONSTRAINT fk_detail_pesanan FOREIGN KEY (id_pesanan)
        REFERENCES pesanan (id_pesanan)
);

-- =====================================================
-- INDEX untuk mempercepat query yang sering dipakai
-- =====================================================
CREATE INDEX idx_pet_user        ON pet (id_user);
CREATE INDEX idx_pesanan_user    ON pesanan (id_user);
CREATE INDEX idx_pesanan_layanan ON pesanan (id_layanan);
CREATE INDEX idx_pesanan_tanggal ON pesanan (tanggal_pesanan);
CREATE INDEX idx_progress_pesanan ON progress_layanan (id_pesanan);

-- =====================================================
-- DATA AWAL (contoh) -- password sebaiknya di-hash di backend
-- =====================================================
INSERT INTO users (password, role, jenis_kelamin) VALUES ('admin123', 'ADMIN', 'P');
INSERT INTO pegawai (id_user, jabatan) VALUES ('USR0001', 'Kasir');
INSERT INTO admin (id_user, nama_kasir, email_kasir)
VALUES ('USR0001', 'Kasir Lana', 'kasir@lanapetshop.com');

INSERT INTO paket_grooming (id_user, nama_layanan, detail_layanan, jenis_paket, harga_paket) VALUES
('USR0001', 'Grooming Basic',   'Mandi, keringkan, sisir bulu',          'Basic',   50000),
('USR0001', 'Grooming Lengkap', 'Mandi, potong bulu, kuku, bersih telinga', 'Premium', 100000);