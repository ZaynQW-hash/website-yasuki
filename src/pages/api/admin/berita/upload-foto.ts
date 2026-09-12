import type { APIRoute } from "astro";
import { uploadToR2 } from "../../../../lib/r2";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("foto");

    if (!(file instanceof File) || file.size === 0) {
      return new Response(JSON.stringify({ error: "File foto tidak ditemukan" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = await uploadToR2(file, "berita-konten");

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Upload foto konten error:", err);
    return new Response(JSON.stringify({ error: "Gagal upload foto" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
