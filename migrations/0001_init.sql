-- Tabel donasi: menyimpan setiap donasi yang masuk lewat form
CREATE TABLE IF NOT EXISTS donasi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode_referensi TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  program TEXT NOT NULL,
  nominal INTEGER NOT NULL,
  pesan TEXT,
  tampilkan_nama INTEGER NOT NULL DEFAULT 0, -- 0 = tidak, 1 = ya (donatur setuju namanya ditampilkan publik)
  status TEXT NOT NULL DEFAULT 'pending', -- pending | terverifikasi | ditolak | kadaluarsa
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  verified_at TEXT
);

-- Tabel berita: artikel yang dikelola admin lewat dashboard
CREATE TABLE IF NOT EXISTS berita (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  kategori TEXT NOT NULL,
  ringkasan TEXT NOT NULL,
  konten TEXT NOT NULL,
  foto TEXT,
  published INTEGER NOT NULL DEFAULT 1, -- 0 = draft, 1 = tayang
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabel admin_users: akun buat login dashboard admin
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nama TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
