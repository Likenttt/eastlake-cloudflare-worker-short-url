import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { SESSION_COOKIE, verifySessionCookie } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const env = getCloudflareEnv();
  const cookieStore = await cookies();
  const isAuthenticated = await verifySessionCookie(cookieStore.get(SESSION_COOKIE)?.value, env.AUTH_SECRET);

  if (isAuthenticated) {
    redirect("/shorten");
  }

  return <LoginForm />;
}
