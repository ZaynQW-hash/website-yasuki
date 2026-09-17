import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id);
    if (!id) return new Response('ID tidak valid', { status: 400 });

        const db = env.yasuki_db;
    const bukti = await db
      .prepare('SELECT object_key, mime_type, original_name FROM donasi_bukti_transfer WHERE donasi_id = ?')
      .bind(id)
      .first<{ object_key: string; mime_type: string; original_name: string }>();

    if (!bukti) return new Response('Bukti transfer belum tersedia', { status: 404 });

    const object = await env.yasuki_media.get(bukti.object_key);
    if (!object || !object.body) return new Response('File bukti transfer tidak ditemukan', { status: 404 });

    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': bukti.mime_type || 'application/octet-stream',
        'Content-Length': String(object.size),
        'Content-Disposition': `inline; filename="${bukti.original_name.replace(/"/g, '')}"`,
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('Lihat bukti donasi error:', err);
    return new Response('Gagal mengambil bukti transfer', { status: 500 });
  }
};
