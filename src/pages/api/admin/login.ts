import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "../../../lib/auth";

interface AdminRow {
  id: number;
  email: string;
  password_hash: string;
  nama: string;
  role: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email dan password wajib diisi" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = env.yasuki_db;
    const user = await db
      .prepare("SELECT id, email, password_hash, nama, role FROM admin_users WHERE email = ?")
      .bind(email)
      .first<AdminRow>();

    if (!user) {
      return new Response(JSON.stringify({ error: "Email atau password salah" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Email atau password salah" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = await createSessionToken({
      uid: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role,
    });

    cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Login error:", err);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan server" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
