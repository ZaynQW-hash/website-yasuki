import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { verifySessionToken, bolehAksesModul, SESSION_COOKIE_NAME } from "./lib/auth";

const MODUL_PATTERN = /^\/(?:admin|api\/admin)\/(donasi|berita|program|galeri|pengguna)(?:\/|$)/;

/** Halaman publik biasa: bukan file statis (css/js/gambar/dll), diakses lewat GET. */
function terlihatSepertiHalaman(request: Request, pathname: string): boolean {
  if (request.method !== "GET") return false;
  const lastSegment = pathname.split("/").pop() || "";
  return !lastSegment.includes(".");
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, request } = context;

  const isAdminPage = url.pathname.startsWith("/admin") && url.pathname !== "/admin/login";
  const isAdminApi = url.pathname.startsWith("/api/admin") && url.pathname !== "/api/admin/login";

  if (!isAdminPage && !isAdminApi) {
    // Catat kunjungan halaman publik buat statistik di dashboard admin.
    if (!url.pathname.startsWith("/api") && terlihatSepertiHalaman(request, url.pathname)) {
      try {
        await env.yasuki_db.prepare("INSERT INTO page_views (path) VALUES (?)").bind(url.pathname).run();
      } catch {
        // gagal senyap, jangan sampai nge-block halaman cuma gara-gara pencatatan gagal
      }
    }
    return next();
  }

  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return redirect("/admin/login");
  }

  // Cek akses per modul (donasi/berita/program/galeri/pengguna) - dashboard utama (/admin) tidak dibatasi.
  const modulMatch = url.pathname.match(MODUL_PATTERN);
  const modul = modulMatch ? modulMatch[1] : null;

  if (modul && !bolehAksesModul(session, modul)) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ error: "Akses ditolak, kamu tidak punya izin ke modul ini" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return redirect("/admin");
  }

  // Data admin yang lagi login bisa diakses lewat Astro.locals.admin di halaman/API manapun di bawah /admin/*
  context.locals.admin = session;

  return next();
});
