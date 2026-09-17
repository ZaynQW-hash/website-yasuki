import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ params, locals }) => {
  const id = Number(params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: "ID tidak valid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
        const db = env.yasuki_db;
    const donasi = await db
      .prepare(`
        SELECT d.id, d.status, d.kode_referensi, b.id AS bukti_id
        FROM donasi d
        LEFT JOIN donasi_bukti_transfer b ON b.donasi_id = d.id
        WHERE d.id = ?
      `)
      .bind(id)
      .first<{ id: number; status: string; kode_referensi: string; bukti_id: number | null }>();

    if (!donasi) {
      return new Response(JSON.stringify({ error: "Donasi tidak ditemukan" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (donasi.status !== "pending") {
      return new Response(JSON.stringify({ error: `Donasi sudah berstatus ${donasi.status}.` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const legacyReference = /^YSK-\d{4}-[A-Z0-9]{4}$/.test(donasi.kode_referensi);
    if (!donasi.bukti_id && !legacyReference) {
      return new Response(JSON.stringify({ error: "Bukti transfer belum diunggah. Minta donatur mengirim bukti terlebih dahulu." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db
      .prepare("UPDATE donasi SET status = 'terverifikasi', verified_at = datetime('now') WHERE id = ?")
      .bind(id)
      .run();

    return new Response(JSON.stringify({ success: true, verified_by: locals.admin?.nama || null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Verifikasi donasi error:", err);
    return new Response(JSON.stringify({ error: "Gagal memverifikasi donasi." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
