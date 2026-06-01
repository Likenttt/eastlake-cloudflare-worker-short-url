import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCookie, SESSION_COOKIE, verifySessionCookie } from "@/lib/crypto";
import { getCloudflareEnv } from "@/lib/cloudflare";
import type { AppEnv } from "@/lib/env";

export async function isAuthenticatedFromRequest(request: Request, env: AppEnv) {
  const value = getCookie(request.headers.get("Cookie"), SESSION_COOKIE);
  return verifySessionCookie(value, env.AUTH_SECRET);
}

export async function requireAuthenticatedRequest(request: Request, env: AppEnv) {
  if (!(await isAuthenticatedFromRequest(request, env))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null;
}

export async function requireAdminPage() {
  const env = getCloudflareEnv();
  const cookieStore = await cookies();
  const isAuthenticated = await verifySessionCookie(cookieStore.get(SESSION_COOKIE)?.value, env.AUTH_SECRET);

  if (!isAuthenticated) {
    redirect("/");
  }
}
