import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedRequest } from "@/lib/auth";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { createLink, listLinks } from "@/lib/links";

const createLinkSchema = z.object({
  longUrl: z.string().min(1),
  slug: z.string().optional(),
  password: z.string().optional(),
  shortUrlLength: z.coerce.number().int().min(3).max(24).optional(),
  expirationMinutes: z.coerce.number().int().positive().optional(),
});

function baseUrlFromRequest(env: CloudflareEnv, request: Request) {
  return env.APP_BASE_URL || new URL(request.url).origin;
}

export async function GET(request: Request) {
  const env = getCloudflareEnv();
  const unauthorized = await requireAuthenticatedRequest(request, env);
  if (unauthorized) {
    return unauthorized;
  }

  return NextResponse.json({ links: await listLinks(env, baseUrlFromRequest(env, request)) });
}

export async function POST(request: Request) {
  const env = getCloudflareEnv();
  const unauthorized = await requireAuthenticatedRequest(request, env);
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);
  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "创建参数无效" }, { status: 400 });
  }

  try {
    const link = await createLink(env, parsed.data, baseUrlFromRequest(env, request));
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建失败" }, { status: 400 });
  }
}
