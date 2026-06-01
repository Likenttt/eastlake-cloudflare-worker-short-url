# East Lake Short URL System

基于 Next.js 和 Cloudflare 的短链接系统。

[简体中文](./readme-zhCN.md)

This project is now a single Cloudflare-first application. The admin UI, short-link redirect handler, KV data access, and asynchronous click counter all run from one Next.js project deployed to Cloudflare Workers through `@opennextjs/cloudflare`.

## Features

- Next.js App Router admin pages: login, link creation, link list, and click history.
- Cloudflare KV stores link records, expiration metadata, and aggregated click stats.
- Cloudflare Queues decouple click counting from redirects. Redirects enqueue a click event with `ctx.waitUntil()`, while the Worker `queue()` handler batches KV counter writes.
- HttpOnly signed admin session cookie. Secrets are read from Cloudflare Worker secrets, not from source code.
- Password-protected short links and expiring links.
- URL parameter prefill for link creation, for example `/shorten?url=https://example.com`.

## Architecture

```
Browser
  -> Cloudflare Worker running OpenNext
      -> Next.js admin routes
      -> /:slug redirect route
          -> Cloudflare Queue producer
      -> queue() consumer
          -> Cloudflare KV aggregate counters
```

KV is eventually consistent and optimized for read-heavy workloads. The queue removes counter writes from the redirect critical path and batches writes, but extremely high concurrency on the same slug can still be approximate. If exact per-click accounting is required, move counters to Durable Objects or D1.

## Requirements

- Node.js 20.9 or newer.
- A Cloudflare account.
- Wrangler login: `npx wrangler login`.

## Cloudflare Setup

Create a KV namespace:

```bash
npx wrangler kv namespace create LINKS
```

Create a queue:

```bash
npx wrangler queues create shorturl-click-events
```

Update `wrangler.jsonc`:

- Replace `kv_namespaces[0].id` with the KV namespace ID.
- Set `APP_BASE_URL` to your short-link domain.
- Set `DEFAULT_REDIRECT_URL` if missing or expired short links should redirect somewhere.

Set secrets:

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put AUTH_SECRET
```

`ADMIN_USERNAME` is a non-secret default in `wrangler.jsonc`. Change it there if needed.

For local development, copy `.dev.vars.example` to `.dev.vars` and fill the same secret values.

## Development

Install dependencies:

```bash
npm install
```

Generate Cloudflare binding types after editing `wrangler.jsonc`:

```bash
npm run cf-typegen
```

Run the Next.js dev server:

```bash
npm run dev
```

Preview in the Workers runtime:

```bash
npm run preview
```

## Deploy

Build and deploy to Cloudflare Workers:

```bash
npm run deploy
```

The deploy script uses `opennextjs-cloudflare build`, then Wrangler deploys `worker.ts`. The custom Worker forwards HTTP requests to the generated OpenNext Worker and handles Queue batches in the same deployed Worker.

## Useful Commands

```bash
npm run typecheck
npm run lint
npm run build
npm run build:worker
npx wrangler tail
```

## Configuration

| Binding or variable | Type | Purpose |
| --- | --- | --- |
| `LINKS` | KV namespace | Link records, stats, and daily click history |
| `CLICK_EVENTS` | Queue | Asynchronous click-event pipeline |
| `ADMIN_USERNAME` | Wrangler var | Admin username |
| `ADMIN_PASSWORD` | Secret | Admin password |
| `AUTH_SECRET` | Secret | HMAC secret for signed session cookies |
| `APP_BASE_URL` | Wrangler var | Public base URL for generated short links |
| `DEFAULT_REDIRECT_URL` | Wrangler var | Fallback redirect URL |
| `RECORD_CLICKS` | Wrangler var | Set to `false` to disable click recording |

## Data Keys

- `link:<slug>` stores the link record.
- `stats:<slug>` stores total clicks and the last click timestamp.
- `click-day:<slug>:YYYY-MM-DD` stores daily click counts.

## Remote PR Status

Before this Cloudflare rewrite, remote PR #2 was fetched and merged locally. It added URL-parameter support for creating short links and default output display behavior; the new Next.js admin keeps that behavior through `/shorten?url=...` and the created-link result panel.
