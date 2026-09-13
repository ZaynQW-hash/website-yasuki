import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { uploadToR2 } from "../../../../lib/r2";

interface MaxUrutanRow {
  maxUrutan: number | null;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const nama = String(formData.get("nama") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const kategori = String(formData.get("kategori") || "").trim();
    const headline = String(formData.get("headline") || "").trim();
    const deskripsi = String(formData.get("deskripsi") || "").trim();
    const hrefCustom = String(formData.get("href_custom") || "").trim();
    const hrefExternal = formData.get("href_external") === "1" ? 1 : 0;
    const unggulan = formData.get("unggulan") === "1" ? 1 : 0;
    const tampilkanProgress = formData.get("tampilkan_progress") === "1" ? 1 : 0;
    const status = formData.get("status") === "1" ? 1 : 0;
    const targetRaw = String(formData.get("target") || "").trim();
    const terkumpulRaw = String(formData.get("terkumpul") || "").trim();
    const fotoFile = formData.get("foto");

    if (!nama || !slug || !kategori || !headline) {
      return new Response(JSON.stringify({ error: "Nama, slug, kategori, dan headline wajib diisi" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const target = targetRaw ? Number(targetRaw) : null;
    const terkumpul = terkumpulRaw ? Number(terkumpulRaw) : null;

    let fotoUrl: string | null = null;
    if (fotoFile instanceof File && fotoFile.size > 0) {
      fotoUrl = await uploadToR2(fotoFile, "program");
    }

    const db = env.yasuki_db;

    const maxRow = await db.prepare("SELECT MAX(urutan) as maxUrutan FROM program").first<MaxUrutanRow>();
    const urutan = (maxRow?.maxUrutan ?? -1) + 1;

    await db
      .prepare(
        `INSERT INTO program
          (nama, slug, kategori, headline, deskripsi, foto, href_custom, href_external, unggulan, target, terkumpul, tampilkan_progress, urutan, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        nama,
        slug,
        kategori,
        headline,
        deskripsi || null,
        fotoUrl,
        hrefCustom || null,
        hrefExternal,
        unggulan,
        target,
        terkumpul,
        tampilkanProgress,
        urutan,
        status,
      )
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Tambah program error:", err);
    const message = String((err as Error)?.message || "").includes("UNIQUE")
      ? "Slug sudah dipakai, coba slug lain"
      : "Terjadi kesalahan server";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
