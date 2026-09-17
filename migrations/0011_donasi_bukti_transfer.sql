-- YASUKI: bukti transfer privat + baseline progress program

CREATE TABLE IF NOT EXISTS donasi_bukti_transfer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  donasi_id INTEGER NOT NULL UNIQUE,
  object_key TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_donasi_bukti_transfer_donasi_id
  ON donasi_bukti_transfer(donasi_id);

CREATE TABLE IF NOT EXISTS program_progress_base (
  program_id INTEGER PRIMARY KEY,
  base_terkumpul INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO program_progress_base (program_id, base_terkumpul)
SELECT
  p.id,
  MAX(
    0,
    COALESCE(p.terkumpul, 0) - COALESCE((
      SELECT SUM(d.nominal)
      FROM donasi d
      WHERE d.status = 'terverifikasi' AND d.program = p.nama
    ), 0)
  )
FROM program p;
