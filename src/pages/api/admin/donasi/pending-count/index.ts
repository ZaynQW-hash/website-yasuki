import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

interface PendingMeta {
  jumlah: number;
  latest_created_at: string | null;
  latest_id: number | null;
}

export const GET: APIRoute = async () => {
  try {
    const db = env.yasuki_db;
    const result = await db
      .prepare(`
        SELECT
          COUNT(*) AS jumlah,
          MAX(created_at) AS latest_created_at,
          MAX(id) AS latest_id
        FROM donasi
        WHERE status = 'pending'
      `)
      .first<PendingMeta>();

    return new Response(
      JSON.stringify({
        success: true,
        jumlah: Number(result?.jumlah ?? 0),
        latest_created_at: result?.latest_created_at ?? null,
        latest_id: result?.latest_id ?? null,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (err) {
    console.error("Cek notifikasi donasi error:", err);
    return new Response(JSON.stringify({ error: "Gagal memuat notifikasi donasi." }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store, max-age=0" },
    });
  }
};
