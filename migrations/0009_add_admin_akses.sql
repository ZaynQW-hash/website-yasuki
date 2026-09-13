-- Kolom akses menyimpan daftar modul yang boleh diakses admin biasa, dipisah koma
-- (contoh: "donasi,berita"). Diabaikan untuk role superadmin, karena superadmin
-- selalu punya akses ke semua modul. Default diisi lengkap biar akun admin yang
-- sudah ada sekarang nggak mendadak kehilangan akses.
ALTER TABLE admin_users ADD COLUMN akses TEXT NOT NULL DEFAULT 'donasi,berita,program,galeri';
