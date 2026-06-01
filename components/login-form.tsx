"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LockKeyhole, Link2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "登录失败");
      setIsSubmitting(false);
      return;
    }

    router.replace("/shorten");
    router.refresh();
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_1.08fr]">
          <div className="flex min-h-[360px] flex-col justify-between bg-neutral-950 p-8 text-white sm:p-10">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md bg-white text-neutral-950">
                <Link2 size={20} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium text-neutral-300">Short URL</p>
                <h1 className="text-xl font-semibold tracking-normal">Cloudflare Admin</h1>
              </div>
            </div>
            <div>
              <p className="mb-3 max-w-sm text-3xl font-semibold leading-tight tracking-normal">
                基于 Next.js 和 Cloudflare 的短链接系统
              </p>
              <p className="max-w-sm text-sm leading-6 text-neutral-300">
                管理端、短链跳转和点击统计部署在同一个 Cloudflare Worker 中。
              </p>
            </div>
          </div>

          <form className="flex flex-col justify-center p-8 sm:p-10" onSubmit={submit}>
            <div className="mb-7">
              <div className="mb-3 flex size-10 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50">
                <LockKeyhole size={18} aria-hidden />
              </div>
              <h2 className="text-2xl font-semibold tracking-normal text-neutral-950">登录管理后台</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">使用 Cloudflare Worker Secret 中配置的管理员凭据。</p>
            </div>

            <label className="mb-2 text-sm font-medium text-neutral-800" htmlFor="username">
              用户名
            </label>
            <input
              id="username"
              className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />

            <label className="mb-2 mt-4 text-sm font-medium text-neutral-800" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-950"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <button
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "登录中" : "进入后台"}
              <ArrowRight size={16} aria-hidden />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
