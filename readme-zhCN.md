# 东湖短链接系统

基于 Next.js 和 Cloudflare 的短链接系统。

[English](./readme.md)

这个项目已经改成 Cloudflare 优先的单项目架构：管理后台、短链跳转、KV 数据读写、异步点击统计都在同一个 Next.js 项目里，通过 `@opennextjs/cloudflare` 部署到 Cloudflare Workers。

## 功能

- Next.js App Router 管理页：登录、创建短链、短链列表、点击历史。
- Cloudflare KV 存储短链、过期信息和聚合点击统计。
- Cloudflare Queues 解耦点击计数。短链跳转只通过 `ctx.waitUntil()` 投递点击事件，Worker 的 `queue()` 消费器批量写入 KV 计数。
- HttpOnly 签名管理员会话 Cookie。密钥通过 Cloudflare Worker Secrets 注入，不写在源码里。
- 支持访问密码和过期时间。
- 支持通过 URL 参数预填原始链接，例如 `/shorten?url=https://example.com`。

## 架构

```
Browser
  -> Cloudflare Worker running OpenNext
      -> Next.js admin routes
      -> /:slug redirect route
          -> Cloudflare Queue producer
      -> queue() consumer
          -> Cloudflare KV aggregate counters
```

KV 是最终一致的读优化存储。Queue 已经把计数写入从跳转关键路径移走，并且会批量聚合写入；但同一个短链在极高并发下仍可能是近似计数。如果需要严格精确计数，建议把计数迁移到 Durable Objects 或 D1。

## 前置要求

- Node.js 20.9 或更新版本。
- Cloudflare 账号。
- 已登录 Wrangler：`npx wrangler login`。

## Cloudflare 配置

创建 KV namespace：

```bash
npx wrangler kv namespace create LINKS
```

创建 Queue：

```bash
npx wrangler queues create shorturl-click-events
```

更新 `wrangler.jsonc`：

- 把 `kv_namespaces[0].id` 替换成你的 KV namespace ID。
- 把 `APP_BASE_URL` 设置为短链域名。
- 如果缺失或过期短链需要跳转到默认页面，设置 `DEFAULT_REDIRECT_URL`。

设置密钥：

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put AUTH_SECRET
```

`ADMIN_USERNAME` 是 `wrangler.jsonc` 里的非密钥配置，需要修改用户名时直接改这里。

本地开发时，复制 `.dev.vars.example` 为 `.dev.vars`，并填入同样的 secret。

## 本地开发

安装依赖：

```bash
npm install
```

修改 `wrangler.jsonc` 后生成 Cloudflare binding 类型：

```bash
npm run cf-typegen
```

运行 Next.js 开发服务：

```bash
npm run dev
```

使用 Workers runtime 预览：

```bash
npm run preview
```

## 部署

构建并部署到 Cloudflare Workers：

```bash
npm run deploy
```

部署脚本会先运行 `opennextjs-cloudflare build`，再由 Wrangler 部署 `worker.ts`。自定义 Worker 会把 HTTP 请求转发给生成的 OpenNext Worker，并在同一个 Worker 里处理 Queue 批次。

## 常用命令

```bash
npm run typecheck
npm run lint
npm run build
npm run build:worker
npx wrangler tail
```

## 配置项

| Binding 或变量 | 类型 | 作用 |
| --- | --- | --- |
| `LINKS` | KV namespace | 短链记录、统计和每日点击历史 |
| `CLICK_EVENTS` | Queue | 异步点击事件队列 |
| `ADMIN_USERNAME` | Wrangler var | 管理员用户名 |
| `ADMIN_PASSWORD` | Secret | 管理员密码 |
| `AUTH_SECRET` | Secret | 签名会话 Cookie 的 HMAC 密钥 |
| `APP_BASE_URL` | Wrangler var | 生成短链时使用的公开域名 |
| `DEFAULT_REDIRECT_URL` | Wrangler var | 默认跳转地址 |
| `RECORD_CLICKS` | Wrangler var | 设置为 `false` 可关闭点击记录 |

## 数据键

- `link:<slug>` 存储短链记录。
- `stats:<slug>` 存储累计点击和最后点击时间。
- `click-day:<slug>:YYYY-MM-DD` 存储每日点击数。

## 远程 PR 状态

在这次 Cloudflare 重写前，已抓取并本地合并远程 PR #2。它加入了通过 URL 参数创建短链和默认展示输出的行为；新的 Next.js 管理后台通过 `/shorten?url=...` 和创建结果面板保留了这个能力。
