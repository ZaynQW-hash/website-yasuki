CREATE TABLE program (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  kategori TEXT NOT NULL,
  headline TEXT NOT NULL,
  deskripsi TEXT,
  foto TEXT,
  href_custom TEXT,
  href_external INTEGER NOT NULL DEFAULT 0,
  unggulan INTEGER NOT NULL DEFAULT 0,
  target INTEGER,
  terkumpul INTEGER,
  tampilkan_progress INTEGER NOT NULL DEFAULT 0,
  urutan INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
