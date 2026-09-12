import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { uploadToR2, deleteFromR2 } from "../../../../lib/r2";

interface BeritaFotoRow {
  foto: string | null;
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
    const existing = await db.prepare("SELECT foto FROM berita WHERE id = ?").bind(id).first<BeritaFotoRow>();
    if (!existing) {
      return new Response(JSON.stringify({ error: "Berita tidak ditemukan" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    const judul = String(formData.get("judul") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const kategori = String(formData.get("kategori") || "").trim();
    const penulis = String(formData.get("penulis") || "").trim();
    const ringkasan = String(formData.get("ringkasan") || "").trim();
    const konten = String(formData.get("konten") || "").trim();
    const published = formData.get("published") === "1" ? 1 : 0;
    const fotoFile = formData.get("foto");

    if (!judul || !slug || !kategori || !ringkasan || !konten) {
      return new Response(JSON.stringify({ error: "Semua field wajib diisi" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let fotoUrl = existing.foto;
    if (fotoFile instanceof File && fotoFile.size > 0) {
      const fotoLama = existing.foto;
      fotoUrl = await uploadToR2(fotoFile, "berita");
      if (fotoLama) {
        await deleteFromR2(fotoLama);
      }
    }

    await db
      .prepare(
        "UPDATE berita SET judul = ?, slug = ?, kategori = ?, penulis = ?, ringkasan = ?, konten = ?, foto = ?, published = ? WHERE id = ?",
      )
      .bind(judul, slug, kategori, penulis || null, ringkasan, konten, fotoUrl, published, id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Update berita error:", err);
    const message = String((err as Error)?.message || "").includes("UNIQUE")
      ? "Slug sudah dipakai, coba slug lain"
      : "Terjadi kesalahan server";
    return new Response(JSON.stringify({ error: message }), {
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
  const existing = await db.prepare("SELECT foto FROM berita WHERE id = ?").bind(id).first<BeritaFotoRow>();

  await db.prepare("DELETE FROM berita WHERE id = ?").bind(id).run();

  if (existing?.foto) {
    await deleteFromR2(existing.foto);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
