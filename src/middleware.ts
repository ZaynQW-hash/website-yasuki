import { defineMiddleware } from "astro:middleware";
import { verifySessionToken, SESSION_COOKIE_NAME } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  const isAdminRoute = url.pathname.startsWith("/admin");
  const isLoginPage = url.pathname === "/admin/login";
  const isLoginApi = url.pathname === "/api/admin/login";

  // Selain rute /admin/*, atau halaman login itu sendiri, biarkan lewat.
  if (!isAdminRoute || isLoginPage || isLoginApi) {
    return next();
  }

  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return redirect("/admin/login");
  }

  // Data admin yang lagi login bisa diakses lewat Astro.locals.admin di halaman manapun di bawah /admin/*
  context.locals.admin = session;

  return next();
});
