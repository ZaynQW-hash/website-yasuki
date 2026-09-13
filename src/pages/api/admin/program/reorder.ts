import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const order = body?.order;

    if (!Array.isArray(order) || order.some((id) => typeof id !== "number")) {
      return new Response(JSON.stringify({ error: "Format urutan tidak valid" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = env.yasuki_db;
    const statements = order.map((id: number, index: number) =>
      db.prepare("UPDATE program SET urutan = ? WHERE id = ?").bind(index, id),
    );
    await db.batch(statements);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Reorder program error:", err);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan server" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
