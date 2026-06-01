import { NextResponse } from "next/server";
import { getCloudflareEnv, getCloudflareRuntime } from "@/lib/cloudflare";
import { verifyPassword } from "@/lib/crypto";
import { deleteLink, getLink } from "@/lib/links";
import type { ClickEvent, LinkRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function wantsClickRecording(env: CloudflareEnv) {
  return String(env.RECORD_CLICKS) !== "false";
}

function notFound(env: CloudflareEnv) {
  if (env.DEFAULT_REDIRECT_URL) {
    return NextResponse.redirect(env.DEFAULT_REDIRECT_URL, { status: 302 });
  }

  return new Response("Not found", { status: 404 });
}

function passwordPage(slug: string, hasError = false) {
  const escapedSlug = slug.replace(/"/g, "&quot;");
  return new Response(
    `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>需要访问密码</title>
    <style>
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f7f7f8; color: #171717; }
      form { width: min(360px, calc(100vw - 32px)); padding: 24px; border: 1px solid #e5e5e5; border-radius: 8px; background: #fff; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08); }
      label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 10px; }
      input { width: 100%; box-sizing: border-box; border: 1px solid #d4d4d4; border-radius: 6px; padding: 10px 12px; font: inherit; }
      button { width: 100%; margin-top: 14px; border: 0; border-radius: 6px; padding: 10px 12px; background: #171717; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
      p { margin: 10px 0 0; color: #b42318; font-size: 13px; }
    </style>
  </head>
  <body>
    <form method="post" action="/${escapedSlug}">
      <label for="password">这个短链接需要访问密码</label>
      <input id="password" name="password" type="password" autocomplete="current-password" autofocus />
      <button type="submit">继续访问</button>
      ${hasError ? "<p>密码不正确</p>" : ""}
    </form>
  </body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" }, status: hasError ? 401 : 200 },
  );
}

function queueClick(request: Request, env: CloudflareEnv, link: LinkRecord) {
  if (!wantsClickRecording(env)) {
    return;
  }

  const runtime = getCloudflareRuntime();
  const event: ClickEvent = {
    slug: link.slug,
    at: new Date().toISOString(),
    referer: request.headers.get("Referer") ?? undefined,
    userAgent: request.headers.get("User-Agent") ?? undefined,
  };

  runtime.ctx.waitUntil(env.CLICK_EVENTS.send(event));
}

async function resolveLink(slug: string, env: CloudflareEnv) {
  const link = await getLink(env, slug);
  if (!link) {
    return null;
  }

  if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) {
    await deleteLink(env, slug);
    return null;
  }

  return link;
}

async function redirectToLink(request: Request, env: CloudflareEnv, link: LinkRecord) {
  queueClick(request, env, link);
  return NextResponse.redirect(link.longUrl, { status: 302 });
}

export async function GET(request: Request, context: RouteContext) {
  const env = getCloudflareEnv();
  const { slug: rawSlug } = await context.params;
  const slug = decodeURIComponent(rawSlug);
  const link = await resolveLink(slug, env);

  if (!link) {
    return notFound(env);
  }

  if (link.passwordHash) {
    const url = new URL(request.url);
    const password = url.searchParams.get("password") ?? url.searchParams.get("p");
    if (!password || !(await verifyPassword(password, link.passwordHash))) {
      return passwordPage(slug, Boolean(password));
    }
  }

  return redirectToLink(request, env, link);
}

export async function POST(request: Request, context: RouteContext) {
  const env = getCloudflareEnv();
  const { slug: rawSlug } = await context.params;
  const slug = decodeURIComponent(rawSlug);
  const link = await resolveLink(slug, env);

  if (!link) {
    return notFound(env);
  }

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");

  if (link.passwordHash && !(await verifyPassword(password, link.passwordHash))) {
    return passwordPage(slug, true);
  }

  return redirectToLink(request, env, link);
}
