import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { deleteR2Object, uploadPrivateToR2 } from '../../../lib/r2';

export const prerender = false;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const kodeReferensi = String(formData.get('kode_referensi') || '').trim().toUpperCase();
    const bukti = formData.get('bukti');

    if (!/^YSK-\d{4}-[A-Z0-9]{8}$/.test(kodeReferensi)) {
      return new Response(JSON.stringify({ error: 'Kode referensi tidak valid.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!(bukti instanceof File) || bukti.size === 0) {
      return new Response(JSON.stringify({ error: 'Pilih bukti transfer terlebih dahulu.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (bukti.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'Ukuran bukti transfer maksimal 5 MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_TYPES.has(bukti.type)) {
      return new Response(JSON.stringify({ error: 'Format bukti harus JPG, PNG, WEBP, atau PDF.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    
    const db = env.yasuki_db;
    const donasi = await db
      .prepare('SELECT id, status FROM donasi WHERE kode_referensi = ?')
      .bind(kodeReferensi)
      .first<{ id: number; status: string }>();

    if (!donasi) {
      return new Response(JSON.stringify({ error: 'Donasi dengan kode referensi tersebut tidak ditemukan.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (donasi.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Donasi ini sudah diproses dan tidak menerima bukti baru.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await db
      .prepare('SELECT object_key FROM donasi_bukti_transfer WHERE donasi_id = ?')
      .bind(donasi.id)
      .first<{ object_key: string }>();

    const uploaded = await uploadPrivateToR2(bukti, 'donasi-bukti', bukti.type);

    try {
      await db
      .prepare(`
        INSERT INTO donasi_bukti_transfer
          (donasi_id, object_key, original_name, mime_type, size_bytes)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(donasi_id) DO UPDATE SET
          object_key = excluded.object_key,
          original_name = excluded.original_name,
          mime_type = excluded.mime_type,
          size_bytes = excluded.size_bytes,
          created_at = datetime('now')
      `)
        .bind(donasi.id, uploaded.key, bukti.name.slice(0, 200), uploaded.contentType, bukti.size)
        .run();
    } catch (dbErr) {
      await deleteR2Object(uploaded.key);
      throw dbErr;
    }

    if (existing?.object_key) {
      await deleteR2Object(existing.object_key);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Bukti transfer berhasil dikirim. Tim kami akan memverifikasinya.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Upload bukti donasi error:', err);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan saat mengunggah bukti transfer.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
