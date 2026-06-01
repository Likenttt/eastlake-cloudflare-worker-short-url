"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, Check, Clipboard, ExternalLink, Link2, LogOut, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { PublicLink } from "@/lib/types";

type AdminDashboardProps = {
  initialLinks: PublicLink[];
  initialLongUrl: string;
};

type FormState = {
  longUrl: string;
  slug: string;
  password: string;
  shortUrlLength: number;
  expirationMinutes: string;
};

const defaultForm = (longUrl = ""): FormState => ({
  longUrl,
  slug: "",
  password: "",
  shortUrlLength: 6,
  expirationMinutes: "",
});

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20 focus-visible:ring-offset-2";

const inputClass =
  "h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition-[border-color,box-shadow] placeholder:text-neutral-400 focus:border-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950/10 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 motion-reduce:transition-none";

const primaryButtonClass =
  "inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition-[background-color,color,opacity] hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

const secondaryButtonClass =
  "inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition-[background-color,border-color,color] hover:border-neutral-300 hover:bg-neutral-50 motion-reduce:transition-none";

const statCardClass = "min-w-0 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm";

function formatDate(value?: string) {
  if (!value) {
    return "无";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isExpired(value?: string) {
  return Boolean(value && new Date(value).getTime() <= Date.now());
}

export function AdminDashboard({ initialLinks, initialLongUrl }: AdminDashboardProps) {
  const [links, setLinks] = useState(initialLinks);
  const [form, setForm] = useState<FormState>(() => defaultForm(initialLongUrl));
  const [createdUrl, setCreatedUrl] = useState("");
  const [message, setMessage] = useState("");
  const [copiedSlug, setCopiedSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalClicks = useMemo(() => links.reduce((sum, link) => sum + link.clicks, 0), [links]);
  const activeLinks = useMemo(() => links.filter((link) => !isExpired(link.expiresAt)).length, [links]);

  async function refreshLinks() {
    setIsRefreshing(true);
    const response = await fetch("/api/links");
    if (response.ok) {
      const data = (await response.json()) as { links: PublicLink[] };
      setLinks(data.links);
    }
    setIsRefreshing(false);
  }

  async function createLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setCreatedUrl("");

    const payload = {
      longUrl: form.longUrl,
      slug: form.slug || undefined,
      password: form.password || undefined,
      shortUrlLength: form.slug ? undefined : form.shortUrlLength,
      expirationMinutes: form.expirationMinutes ? Number(form.expirationMinutes) : undefined,
    };

    const response = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as { link?: PublicLink; error?: string } | null;
    if (!response.ok || !data?.link) {
      setMessage(data?.error ?? "创建失败");
      setIsSubmitting(false);
      return;
    }

    setLinks((current) => [data.link!, ...current]);
    setCreatedUrl(data.link.shortUrl);
    setForm(defaultForm());
    setIsSubmitting(false);
  }

  async function deleteLink(slug: string) {
    const response = await fetch(`/api/links/${encodeURIComponent(slug)}`, { method: "DELETE" });
    if (response.ok) {
      setLinks((current) => current.filter((link) => link.slug !== slug));
    }
  }

  async function copy(value: string, slug: string) {
    await navigator.clipboard.writeText(value);
    setCopiedSlug(slug);
    window.setTimeout(() => setCopiedSlug(""), 1400);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-neutral-950 text-white">
              <Link2 size={19} aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-normal text-neutral-950">短链接管理</h1>
              <p className="text-sm text-neutral-500">Next.js on Cloudflare Workers</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link
              className={`${secondaryButtonClass} ${focusRing} sm:min-h-9`}
              href="/history"
            >
              <BarChart3 size={16} aria-hidden />
              历史
            </Link>
            <button
              className={`${secondaryButtonClass} ${focusRing} sm:min-h-9`}
              onClick={refreshLinks}
              type="button"
            >
              <RefreshCw className={isRefreshing ? "animate-spin motion-reduce:animate-none" : ""} size={16} aria-hidden />
              刷新
            </button>
            <button
              className={`${primaryButtonClass} ${focusRing} px-3 sm:min-h-9`}
              onClick={logout}
              type="button"
            >
              <LogOut size={16} aria-hidden />
              退出
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(340px,420px)_1fr] lg:px-8">
        <section className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-sm font-medium text-neutral-500">Create</p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal text-neutral-950">创建短链接</h2>
          </div>

          <form className="grid gap-4" onSubmit={createLink}>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800" htmlFor="longUrl">
                原始链接
              </label>
              <input
                id="longUrl"
                className={inputClass}
                value={form.longUrl}
                onChange={(event) => setForm((current) => ({ ...current, longUrl: event.target.value }))}
                placeholder="https://example.com/article"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800" htmlFor="slug">
                  自定义后缀
                </label>
                <input
                  id="slug"
                  className={inputClass}
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  placeholder="optional"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800" htmlFor="length">
                  随机长度
                </label>
                <input
                  id="length"
                  className={`${inputClass} tabular-nums`}
                  max={24}
                  min={3}
                  type="number"
                  value={form.shortUrlLength}
                  onChange={(event) => setForm((current) => ({ ...current, shortUrlLength: Number(event.target.value) }))}
                  disabled={Boolean(form.slug)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800" htmlFor="password">
                  访问密码
                </label>
                <input
                  id="password"
                  className={inputClass}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="optional"
                  type="password"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800" htmlFor="expires">
                  有效分钟
                </label>
                <input
                  id="expires"
                  className={`${inputClass} tabular-nums`}
                  min={1}
                  type="number"
                  value={form.expirationMinutes}
                  onChange={(event) => setForm((current) => ({ ...current, expirationMinutes: event.target.value }))}
                  placeholder="永久"
                />
              </div>
            </div>

            {message ? (
              <p aria-live="polite" className="text-sm text-red-600">
                {message}
              </p>
            ) : null}

            <button
              className={`${primaryButtonClass} ${focusRing}`}
              disabled={isSubmitting}
              type="submit"
            >
              <Plus size={16} aria-hidden />
              {isSubmitting ? "创建中" : "创建短链接"}
            </button>
          </form>

          {createdUrl ? (
            <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="mb-2 text-sm font-medium text-emerald-900">已创建</p>
              <button
                className={`flex min-h-11 w-full touch-manipulation items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-left text-sm text-emerald-950 ring-1 ring-emerald-200 transition-[background-color,box-shadow] hover:bg-emerald-50/60 motion-reduce:transition-none ${focusRing}`}
                type="button"
                onClick={() => copy(createdUrl, "created")}
              >
                <span className="min-w-0 truncate">{createdUrl}</span>
                {copiedSlug === "created" ? <Check size={16} aria-hidden /> : <Clipboard size={16} aria-hidden />}
              </button>
            </div>
          ) : null}
        </section>

        <section className="min-w-0">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className={statCardClass}>
              <p className="text-sm text-neutral-500">总短链</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-normal text-neutral-950">{links.length}</p>
            </div>
            <div className={statCardClass}>
              <p className="text-sm text-neutral-500">有效短链</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-normal text-neutral-950">{activeLinks}</p>
            </div>
            <div className={statCardClass}>
              <p className="text-sm text-neutral-500">累计点击</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-normal text-neutral-950">{totalClicks}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 px-4 py-3">
              <h2 className="text-base font-semibold tracking-normal text-neutral-950">短链列表</h2>
            </div>

            <div className="divide-y divide-neutral-200 md:hidden">
              {links.map((link) => (
                <article key={link.slug} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      className={`flex min-w-0 flex-1 touch-manipulation items-start gap-2 rounded-sm text-left ${focusRing}`}
                      type="button"
                      onClick={() => copy(link.shortUrl, link.slug)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-neutral-950">{link.shortUrl}</span>
                        <span className="mt-1 block text-xs text-neutral-500">/{link.slug}</span>
                      </span>
                      <span className="mt-0.5 shrink-0 text-neutral-500">
                        {copiedSlug === link.slug ? <Check size={15} aria-hidden /> : <Clipboard size={15} aria-hidden />}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        aria-label={`查看 /${link.slug} 的点击历史`}
                        className={`inline-flex size-11 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 transition-[background-color,border-color,color] hover:bg-neutral-50 motion-reduce:transition-none ${focusRing}`}
                        href={`/history?slug=${encodeURIComponent(link.slug)}`}
                        title="查看历史"
                      >
                        <BarChart3 size={15} aria-hidden />
                      </Link>
                      <button
                        aria-label={`删除 /${link.slug}`}
                        className={`inline-flex size-11 touch-manipulation items-center justify-center rounded-md border border-neutral-200 bg-white text-red-600 transition-[background-color,border-color,color] hover:border-red-200 hover:bg-red-50 motion-reduce:transition-none ${focusRing}`}
                        type="button"
                        onClick={() => deleteLink(link.slug)}
                        title="删除"
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>
                  </div>

                  <a
                    className={`mt-3 flex min-h-10 max-w-full items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-700 transition-[background-color,color] hover:bg-white hover:text-neutral-950 motion-reduce:transition-none ${focusRing}`}
                    href={link.longUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="min-w-0 truncate">{link.longUrl}</span>
                    <ExternalLink className="shrink-0" size={14} aria-hidden />
                  </a>

                  <dl className="mt-4 grid grid-cols-2 gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
                    <div>
                      <dt className="text-xs text-neutral-500">点击</dt>
                      <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-neutral-950">{link.clicks}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-neutral-500">过期</dt>
                      <dd className="mt-1 font-mono text-sm tabular-nums text-neutral-700">
                        {link.expiresAt ? formatDate(link.expiresAt) : "永久"}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-neutral-500">最后点击</dt>
                      <dd className="mt-1 font-mono text-sm tabular-nums text-neutral-700">{formatDate(link.lastClickedAt)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
              {links.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-neutral-500">还没有短链接</div>
              ) : null}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium uppercase tracking-[0.02em]">短链接</th>
                    <th className="px-4 py-3 font-medium uppercase tracking-[0.02em]">目标链接</th>
                    <th className="px-4 py-3 font-medium uppercase tracking-[0.02em]">点击</th>
                    <th className="px-4 py-3 font-medium uppercase tracking-[0.02em]">过期</th>
                    <th className="px-4 py-3 font-medium uppercase tracking-[0.02em]">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {links.map((link) => (
                    <tr key={link.slug} className="align-top transition-[background-color] hover:bg-neutral-50/70 motion-reduce:transition-none">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 flex-col gap-1">
                          <button
                            className={`inline-flex max-w-[260px] touch-manipulation items-center gap-2 rounded-sm text-left font-medium text-neutral-950 ${focusRing}`}
                            type="button"
                            onClick={() => copy(link.shortUrl, link.slug)}
                          >
                            <span className="truncate">{link.shortUrl}</span>
                            {copiedSlug === link.slug ? <Check size={15} aria-hidden /> : <Clipboard size={15} aria-hidden />}
                          </button>
                          <span className="text-xs text-neutral-500">/{link.slug}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          className={`inline-flex max-w-[320px] items-center gap-2 rounded-sm text-neutral-700 transition-[color] hover:text-neutral-950 motion-reduce:transition-none ${focusRing}`}
                          href={link.longUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="truncate">{link.longUrl}</span>
                          <ExternalLink size={14} aria-hidden />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        <div className="font-mono font-medium tabular-nums text-neutral-950">{link.clicks}</div>
                        <div className="font-mono text-xs tabular-nums text-neutral-500">{formatDate(link.lastClickedAt)}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-neutral-700 tabular-nums">
                        {link.expiresAt ? formatDate(link.expiresAt) : "永久"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            aria-label={`查看 /${link.slug} 的点击历史`}
                            className={`inline-flex size-11 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 transition-[background-color,border-color,color] hover:bg-neutral-50 motion-reduce:transition-none sm:size-9 ${focusRing}`}
                            href={`/history?slug=${encodeURIComponent(link.slug)}`}
                            title="查看历史"
                          >
                            <BarChart3 size={15} aria-hidden />
                          </Link>
                          <button
                            aria-label={`删除 /${link.slug}`}
                            className={`inline-flex size-11 touch-manipulation items-center justify-center rounded-md border border-neutral-200 bg-white text-red-600 transition-[background-color,border-color,color] hover:border-red-200 hover:bg-red-50 motion-reduce:transition-none sm:size-9 ${focusRing}`}
                            type="button"
                            onClick={() => deleteLink(link.slug)}
                            title="删除"
                          >
                            <Trash2 size={15} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {links.length === 0 ? (
                    <tr>
                      <td className="px-4 py-12 text-center text-neutral-500" colSpan={5}>
                        还没有短链接
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
