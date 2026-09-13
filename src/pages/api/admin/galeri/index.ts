import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { uploadToR2 } from "../../../../lib/r2";

interface MaxUrutanRow {
  maxUrutan: number | null;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const kategori = String(formData.get("kategori") || "").trim();
    const caption = String(formData.get("caption") || "").trim();
    const status = formData.get("aktif") === "1" ? 1 : 0;
    const fotoFile = formData.get("foto");

    if (!kategori || !caption) {
      return new Response(JSON.stringify({ error: "Kategori dan caption wajib diisi" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!(fotoFile instanceof File) || fotoFile.size === 0) {
      return new Response(JSON.stringify({ error: "Foto wajib diupload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fotoUrl = await uploadToR2(fotoFile, "galeri");

    const db = env.yasuki_db;
    const maxRow = await db.prepare("SELECT MAX(urutan) as maxUrutan FROM galeri").first<MaxUrutanRow>();
    const urutan = (maxRow?.maxUrutan ?? 0) + 10;

    await db
      .prepare("INSERT INTO galeri (foto, kategori, caption, urutan, aktif) VALUES (?, ?, ?, ?, ?)")
      .bind(fotoUrl, kategori, caption, urutan, status)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Tambah galeri error:", err);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan server" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
