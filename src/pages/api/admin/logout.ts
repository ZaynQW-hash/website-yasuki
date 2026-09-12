import type { APIRoute } from "astro";
import { SESSION_COOKIE_NAME } from "../../../lib/auth";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
  return redirect("/admin/login");
};
