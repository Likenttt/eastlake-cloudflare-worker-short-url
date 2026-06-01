import { NextResponse } from "next/server";
import { requireAuthenticatedRequest } from "@/lib/auth";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { getClickHistory, getLink, getLinkStats } from "@/lib/links";

export async function GET(request: Request) {
  const env = getCloudflareEnv();
  const unauthorized = await requireAuthenticatedRequest(request, env);
  if (unauthorized) {
    return unauthorized;
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim();
  const days = Number(url.searchParams.get("days") ?? "30");

  if (!slug) {
    return NextResponse.json({ error: "缺少短链后缀" }, { status: 400 });
  }

  const link = await getLink(env, slug);
  if (!link) {
    return NextResponse.json({ error: "短链不存在" }, { status: 404 });
  }

  const [stats, history] = await Promise.all([
    getLinkStats(env, slug),
    getClickHistory(env, slug, Number.isFinite(days) ? Math.min(Math.max(days, 7), 180) : 30),
  ]);

  return NextResponse.json({ link, stats, history });
}
