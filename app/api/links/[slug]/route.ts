import { NextResponse } from "next/server";
import { requireAuthenticatedRequest } from "@/lib/auth";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { deleteLink } from "@/lib/links";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const env = getCloudflareEnv();
  const unauthorized = await requireAuthenticatedRequest(request, env);
  if (unauthorized) {
    return unauthorized;
  }

  const { slug } = await context.params;
  await deleteLink(env, decodeURIComponent(slug));
  return NextResponse.json({ ok: true });
}
