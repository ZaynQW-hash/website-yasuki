-- Menambahkan kolom role ke tabel admin_users.
-- Default 'admin' untuk akun yang sudah ada; akun pertama akan
-- di-set manual jadi 'superadmin' lewat script seed.
ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin';
