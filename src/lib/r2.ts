import { env } from "cloudflare:workers";

const PUBLIC_R2_URL = "https://pub-31fb1875b1704f9682f558599e8d8a43.r2.dev";

/** Upload file ke bucket R2, kembalikan URL publiknya. */
export async function uploadToR2(file: File, folder: string): Promise<string> {
  const originalExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = /^(jpg|jpeg|png|webp|gif)$/.test(originalExt) ? originalExt : "jpg";
  const key = `${folder}/${crypto.randomUUID()}.${safeExt}`;

  const buffer = await file.arrayBuffer();
  await env.yasuki_media.put(key, buffer, {
    httpMetadata: { contentType: file.type || "image/jpeg" },
  });

  return `${PUBLIC_R2_URL}/${key}`;
}

/** Hapus file dari R2 berdasarkan URL publiknya. Gagal senyap kalau bukan URL R2 kita atau file sudah tidak ada. */
export async function deleteFromR2(url: string): Promise<void> {
  if (!url.startsWith(PUBLIC_R2_URL)) return;
  const key = url.slice(PUBLIC_R2_URL.length + 1);
  try {
    await env.yasuki_media.delete(key);
  } catch {
    // biarin gagal senyap, bukan hal kritikal
  }
}
