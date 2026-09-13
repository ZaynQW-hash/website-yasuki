-- Kolom status aktif untuk admin_users, biar superadmin bisa nonaktifkan akun
-- admin lain (misal sudah tidak bertugas) tanpa perlu menghapusnya permanen.
ALTER TABLE admin_users ADD COLUMN aktif INTEGER NOT NULL DEFAULT 1;
