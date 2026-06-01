"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BarChart3, Link2, LogOut, RefreshCw } from "lucide-react";
import type { HistoryPoint, LinkStats, PublicLink } from "@/lib/types";

type HistoryPanelProps = {
  initialLinks: PublicLink[];
  initialSlug: string;
  initialStats: LinkStats;
  initialHistory: HistoryPoint[];
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20 focus-visible:ring-offset-2";

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-neutral-950 px-3 text-sm font-medium text-white transition-[background-color,color,opacity] hover:bg-neutral-800 motion-reduce:transition-none";

const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition-[background-color,border-color,color] hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

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

export function HistoryPanel({ initialLinks, initialSlug, initialStats, initialHistory }: HistoryPanelProps) {
  const [links] = useState(initialLinks);
  const [slug, setSlug] = useState(initialSlug);
  const [stats, setStats] = useState(initialStats);
  const [history, setHistory] = useState(initialHistory);
  const [isLoading, setIsLoading] = useState(false);
  const maxClicks = Math.max(1, ...history.map((point) => point.clicks));
  const selected = links.find((link) => link.slug === slug);

  async function loadHistory(nextSlug = slug) {
    if (!nextSlug) {
      return;
    }

    setIsLoading(true);
    const response = await fetch(`/api/history?slug=${encodeURIComponent(nextSlug)}&days=30`);
    if (response.ok) {
      const data = (await response.json()) as { stats: LinkStats; history: HistoryPoint[] };
      setStats(data.stats);
      setHistory(data.history);
    }
    setIsLoading(false);
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
              <BarChart3 size={19} aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-normal text-neutral-950">点击历史</h1>
              <p className="text-sm text-neutral-500">由 Cloudflare Queue 异步聚合</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link
              className={`${secondaryButtonClass} ${focusRing} sm:min-h-9`}
              href="/shorten"
            >
              <ArrowLeft size={16} aria-hidden />
              管理
            </Link>
            <button
              className={`${primaryButtonClass} ${focusRing} sm:min-h-9`}
              onClick={logout}
              type="button"
            >
              <LogOut size={16} aria-hidden />
              退出
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-lg">
              <label className="mb-2 block text-sm font-medium text-neutral-800" htmlFor="slug">
                选择短链接
              </label>
              <select
                id="slug"
                className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition-[border-color,box-shadow] focus:border-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950/10 motion-reduce:transition-none"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  void loadHistory(event.target.value);
                }}
              >
                {links.map((link) => (
                  <option key={link.slug} value={link.slug}>
                    /{link.slug}
                  </option>
                ))}
              </select>
            </div>
            <button
              className={`${secondaryButtonClass} ${focusRing} px-4`}
              disabled={!slug || isLoading}
              onClick={() => loadHistory()}
              type="button"
            >
              <RefreshCw className={isLoading ? "animate-spin motion-reduce:animate-none" : ""} size={16} aria-hidden />
              刷新历史
            </button>
          </div>
        </section>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className={statCardClass}>
            <p className="text-sm text-neutral-500">总点击</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-normal text-neutral-950">{stats.total}</p>
          </div>
          <div className={statCardClass}>
            <p className="text-sm text-neutral-500">最后点击</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-normal text-neutral-950">
              {formatDate(stats.lastClickedAt)}
            </p>
          </div>
          <div className={statCardClass}>
            <p className="text-sm text-neutral-500">目标链接</p>
            <p className="mt-2 flex min-w-0 items-center gap-2 text-sm font-medium text-neutral-950">
              <Link2 className="shrink-0" size={15} aria-hidden />
              <span className="min-w-0 truncate">{selected?.longUrl ?? "无"}</span>
            </p>
          </div>
        </div>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-500">Last 30 days</p>
              <h2 className="mt-1 text-xl font-semibold tracking-normal text-neutral-950">每日点击趋势</h2>
            </div>
          </div>

          <div className="grid h-[320px] grid-cols-[repeat(30,minmax(2px,1fr))] items-end gap-1 overflow-hidden border-b border-neutral-200 pb-3 sm:grid-cols-[repeat(30,minmax(9px,1fr))] sm:gap-2">
            {history.map((point) => (
              <div key={point.date} className="group flex h-full min-w-0 flex-col justify-end">
                <div
                  className={`min-h-1 rounded-sm transition-[background-color] motion-reduce:transition-none ${
                    point.clicks > 0 ? "bg-neutral-950 group-hover:bg-emerald-600" : "bg-neutral-200 group-hover:bg-neutral-300"
                  }`}
                  style={{ height: point.clicks > 0 ? `${Math.max(2, (point.clicks / maxClicks) * 100)}%` : "2px" }}
                  title={`${point.date}: ${point.clicks}`}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between font-mono text-xs tabular-nums text-neutral-500">
            <span>{history[0]?.date ?? "无数据"}</span>
            <span>{history.at(-1)?.date ?? "无数据"}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
