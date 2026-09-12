import { defineMiddleware } from "astro:middleware";
import { verifySessionToken, SESSION_COOKIE_NAME } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  const isAdminPage = url.pathname.startsWith("/admin") && url.pathname !== "/admin/login";
  const isAdminApi = url.pathname.startsWith("/api/admin") && url.pathname !== "/api/admin/login";

  if (!isAdminPage && !isAdminApi) {
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

  // Data admin yang lagi login bisa diakses lewat Astro.locals.admin di halaman/API manapun di bawah /admin/*
  context.locals.admin = session;

  return next();
});
