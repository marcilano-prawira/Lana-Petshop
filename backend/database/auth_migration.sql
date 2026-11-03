-- Jalankan: psql -U postgres -d lana_petshop -f database/auth_migration.sql

-- 1. Kolom username untuk login
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);

UPDATE users SET username = 'admin' WHERE id_user = 'USR0001' AND username IS NULL;
UPDATE users SET username = LOWER(id_user) WHERE username IS NULL;   -- user lain (jika ada)

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT uq_users_username UNIQUE (username);

-- 2. Tabel token yang dicabut saat logout
CREATE TABLE IF NOT EXISTS token_dicabut (
    jti         VARCHAR(50) PRIMARY KEY,
    id_user     VARCHAR(20) NOT NULL,
    expired_at  TIMESTAMP   NOT NULL,
    dicabut_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_token_user FOREIGN KEY (id_user)
        REFERENCES users (id_user) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_token_expired ON token_dicabut (expired_at);
