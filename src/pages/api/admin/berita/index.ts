import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { uploadToR2 } from "../../../../lib/r2";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const judul = String(formData.get("judul") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const kategori = String(formData.get("kategori") || "").trim();
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

    let fotoUrl: string | null = null;
    if (fotoFile instanceof File && fotoFile.size > 0) {
      fotoUrl = await uploadToR2(fotoFile, "berita");
    }

    const db = env.yasuki_db;
    await db
      .prepare(
        "INSERT INTO berita (judul, slug, kategori, ringkasan, konten, foto, published) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(judul, slug, kategori, ringkasan, konten, fotoUrl, published)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Tambah berita error:", err);
    const message = String((err as Error)?.message || "").includes("UNIQUE")
      ? "Slug sudah dipakai, coba slug lain"
      : "Terjadi kesalahan server";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
