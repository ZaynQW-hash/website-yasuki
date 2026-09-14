import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Domain final produksi — dipakai buat canonical URL, sitemap, dan og:url.
  // Tetap diisi ini walau sekarang masih jalan di domain staging; begitu
  // yasuki.site beneran dipindah ke website ini, gak perlu ubah apa-apa lagi.
  site: 'https://yasuki.site',
  output: 'server',
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
  },
});
