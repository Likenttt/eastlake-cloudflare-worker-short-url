import { NextResponse } from "next/server";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { createSessionCookie, secureCompareText } from "@/lib/crypto";

export async function POST(request: Request) {
  const env = getCloudflareEnv();
  const body = (await request.json().catch(() => null)) as { username?: string; password?: string } | null;
  const username = body?.username?.trim() ?? "";
  const password = body?.password ?? "";

  const [usernameMatches, passwordMatches] = await Promise.all([
    secureCompareText(username, env.ADMIN_USERNAME),
    secureCompareText(password, env.ADMIN_PASSWORD),
  ]);

  if (!usernameMatches || !passwordMatches) {
    return NextResponse.json({ error: "账号或密码不正确" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", await createSessionCookie(env.AUTH_SECRET, request.url));
  return response;
}
