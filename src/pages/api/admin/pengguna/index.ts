import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { hashPassword } from "../../../../lib/auth";
import { MODUL_ADMIN } from "../../../../lib/modul-admin";

export const POST: APIRoute = async ({ request, locals }) => {
  const session = locals.admin;
  if (!session || session.role !== "superadmin") {
    return new Response(JSON.stringify({ error: "Akses ditolak, cuma superadmin yang bisa menambah admin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const nama = String(body.nama || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const role = body.role === "superadmin" ? "superadmin" : "admin";

    const validModulKeys = MODUL_ADMIN.map((m) => m.key);
    const aksesArray = Array.isArray(body.akses) ? body.akses.filter((a: string) => validModulKeys.includes(a)) : [];
    const akses = role === "superadmin" ? validModulKeys.join(",") : aksesArray.join(",");

    if (!nama || !email || !password) {
      return new Response(JSON.stringify({ error: "Nama, email, dan password wajib diisi" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password minimal 8 karakter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const passwordHash = await hashPassword(password);

    const db = env.yasuki_db;
    await db
      .prepare("INSERT INTO admin_users (email, password_hash, nama, role, akses) VALUES (?, ?, ?, ?, ?)")
      .bind(email, passwordHash, nama, role, akses)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Tambah admin error:", err);
    const message = String((err as Error)?.message || "").includes("UNIQUE") ? "Email sudah dipakai" : "Terjadi kesalahan server";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
