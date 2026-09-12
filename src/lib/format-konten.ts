function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Ubah teks isi berita jadi HTML aman.
 * - Paragraf dipisah oleh baris kosong (Enter dua kali)
 * - Baris tunggal di dalam 1 paragraf jadi <br />
 * - Blok yang isinya cuma "[FOTO:url]" diubah jadi <img>
 * Semua teks di-escape dulu sebelum diproses, jadi aman dari suntikan HTML/script.
 */
export function renderKontenBerita(konten: string): string {
  const blocks = konten
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const fotoMatch = block.match(/^\[FOTO:(.+?)\]$/);
      if (fotoMatch) {
        const url = fotoMatch[1].trim();
        return `<img src="${escapeHtml(url)}" alt="" class="w-full rounded-xl my-6" />`;
      }

      const escaped = escapeHtml(block).replace(/\n/g, "<br />");
      return `<p class="mb-4 leading-relaxed">${escaped}</p>`;
    })
    .join("\n");
}
