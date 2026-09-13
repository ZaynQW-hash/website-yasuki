import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { hashPassword } from "../../../../lib/auth";
import { MODUL_ADMIN } from "../../../../lib/modul-admin";

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const session = locals.admin;
  if (!session || session.role !== "superadmin") {
    return new Response(JSON.stringify({ error: "Akses ditolak, cuma superadmin yang bisa mengubah data admin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const id = Number(params.id);
    if (!id) {
      return new Response(JSON.stringify({ error: "ID tidak valid" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isSelf = id === session.uid;

    const body = await request.json();
    const nama = String(body.nama || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = body.password ? String(body.password) : "";
    const role = isSelf ? session.role : body.role === "superadmin" ? "superadmin" : "admin";
    const aktif = isSelf ? 1 : body.aktif === false ? 0 : 1;

    const validModulKeys = MODUL_ADMIN.map((m) => m.key);
    const aksesArray = Array.isArray(body.akses) ? body.akses.filter((a: string) => validModulKeys.includes(a)) : [];
    const akses = role === "superadmin" ? validModulKeys.join(",") : aksesArray.join(",");

    if (!nama || !email) {
      return new Response(JSON.stringify({ error: "Nama dan email wajib diisi" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (password && password.length < 8) {
      return new Response(JSON.stringify({ error: "Password baru minimal 8 karakter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = env.yasuki_db;

    if (password) {
      const passwordHash = await hashPassword(password);
      await db
        .prepare("UPDATE admin_users SET nama = ?, email = ?, password_hash = ?, role = ?, aktif = ?, akses = ? WHERE id = ?")
        .bind(nama, email, passwordHash, role, aktif, akses, id)
        .run();
    } else {
      await db
        .prepare("UPDATE admin_users SET nama = ?, email = ?, role = ?, aktif = ?, akses = ? WHERE id = ?")
        .bind(nama, email, role, aktif, akses, id)
        .run();
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Update admin error:", err);
    const message = String((err as Error)?.message || "").includes("UNIQUE") ? "Email sudah dipakai" : "Terjadi kesalahan server";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const session = locals.admin;
  if (!session || session.role !== "superadmin") {
    return new Response(JSON.stringify({ error: "Akses ditolak, cuma superadmin yang bisa menghapus admin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const id = Number(params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: "ID tidak valid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (id === session.uid) {
    return new Response(JSON.stringify({ error: "Nggak bisa menghapus akun sendiri" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = env.yasuki_db;
  await db.prepare("DELETE FROM admin_users WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
