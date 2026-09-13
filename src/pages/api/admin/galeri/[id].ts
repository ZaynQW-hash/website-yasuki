import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { uploadToR2, deleteFromR2 } from "../../../../lib/r2";

interface GaleriRow {
  foto: string;
}

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = Number(params.id);
    if (!id) {
      return new Response(JSON.stringify({ error: "ID tidak valid" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = env.yasuki_db;
    const existing = await db.prepare("SELECT foto FROM galeri WHERE id = ?").bind(id).first<GaleriRow>();
    if (!existing) {
      return new Response(JSON.stringify({ error: "Foto tidak ditemukan" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    const kategori = String(formData.get("kategori") || "").trim();
    const caption = String(formData.get("caption") || "").trim();
    const urutanRaw = String(formData.get("urutan") || "").trim();
    const status = formData.get("aktif") === "1" ? 1 : 0;
    const fotoFile = formData.get("foto");

    if (!kategori || !caption) {
      return new Response(JSON.stringify({ error: "Kategori dan caption wajib diisi" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const urutan = urutanRaw ? Number(urutanRaw) : 0;

    let fotoUrl = existing.foto;
    if (fotoFile instanceof File && fotoFile.size > 0) {
      const fotoLama = existing.foto;
      fotoUrl = await uploadToR2(fotoFile, "galeri");
      await deleteFromR2(fotoLama);
    }

    await db
      .prepare("UPDATE galeri SET foto = ?, kategori = ?, caption = ?, urutan = ?, aktif = ? WHERE id = ?")
      .bind(fotoUrl, kategori, caption, urutan, status, id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Update galeri error:", err);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan server" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: "ID tidak valid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = env.yasuki_db;
  const existing = await db.prepare("SELECT foto FROM galeri WHERE id = ?").bind(id).first<GaleriRow>();

  await db.prepare("DELETE FROM galeri WHERE id = ?").bind(id).run();

  if (existing?.foto) {
    await deleteFromR2(existing.foto);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
