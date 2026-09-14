import type { APIRoute } from "astro";

// Cuma host produksi yang boleh diindex. Semua host lain (staging, preview,
// *.workers.dev, dll) otomatis di-Disallow biar Google nggak keburu nge-index
// versi yang belum final. Begitu yasuki.site beneran dipindah ke website ini,
// otomatis kebuka tanpa perlu ubah apa-apa.
const PRODUCTION_HOSTS = ["yasuki.site", "www.yasuki.site"];

export const GET: APIRoute = async ({ request }) => {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const isProduction = PRODUCTION_HOSTS.includes(host);

  const body = isProduction
    ? `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://yasuki.site/sitemap.xml
`
    : `User-agent: *
Disallow: /
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
