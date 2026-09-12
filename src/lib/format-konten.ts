function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Konversi format lama (teks polos + penanda [FOTO:url]) jadi HTML. Dipakai buat data lama, sebelum ada rich text editor. */
function renderFormatLama(konten: string): string {
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

/**
 * Ubah kolom `konten` jadi HTML siap tampil (dipakai di halaman publik & buat isi awal rich text editor).
 * - Kalau kontennya udah HTML asli (hasil rich text editor), langsung dipakai apa adanya.
 * - Kalau masih format lama (teks polos + [FOTO:url], dari sebelum ada rich text editor), dikonversi dulu.
 */
export function renderKontenBerita(konten: string): string {
  const trimmed = konten.trim();
  if (trimmed.startsWith("<")) {
    return konten;
  }
  return renderFormatLama(konten);
}
