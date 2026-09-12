import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: "ID tidak valid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = env.yasuki_db;
  await db
    .prepare("UPDATE donasi SET status = 'ditolak', verified_at = datetime('now') WHERE id = ?")
    .bind(id)
    .run();

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
