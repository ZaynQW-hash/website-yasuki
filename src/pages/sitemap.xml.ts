import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { formatTanggalSitemap } from "../../lib/date";

const SITE = "https://yasuki.site";

const halamanStatis = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/program", priority: "0.9", changefreq: "weekly" },
  { path: "/berita", priority: "0.9", changefreq: "daily" },
  { path: "/galeri", priority: "0.7", changefreq: "weekly" },
  { path: "/profil", priority: "0.6", changefreq: "monthly" },
  { path: "/kontak", priority: "0.5", changefreq: "yearly" },
  { path: "/donasi", priority: "0.8", changefreq: "monthly" },
];

function toLastmod(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return formatTanggalSitemap(iso);
}

export const GET: APIRoute = async () => {
  const db = env.yasuki_db;

  const [{ results: beritaRows }, { results: programRows }] = await Promise.all([
    db.prepare("SELECT slug, created_at FROM berita WHERE published = 1").all<{ slug: string; created_at: string }>(),
    db.prepare("SELECT slug FROM program WHERE status = 1").all<{ slug: string }>(),
  ]);

  const urls: string[] = [];

  for (const h of halamanStatis) {
    urls.push(`<url><loc>${SITE}${h.path}</loc><changefreq>${h.changefreq}</changefreq><priority>${h.priority}</priority></url>`);
  }

  for (const b of beritaRows) {
    const lastmod = toLastmod(b.created_at);
    urls.push(
      `<url><loc>${SITE}/berita/${b.slug}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    );
  }

  for (const p of programRows) {
    urls.push(`<url><loc>${SITE}/program/${p.slug}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
