# East Lake Short URL System

Based on Cloudflare Workers & Vercel

[🇨🇳 简体中文](./readme-zhCN.md)

**Try it now:** https://cf-url-admin.li2niu.com/

- Username: li2niu
- Password: li2niu

_Please don't delete data with many clicks. We believe you won't._

## Short URL Examples:

- https://u.li2niu.com/tcK
- https://u.li2niu.com/666 (For 404)

## Screenshots

![Login](./images/screenshots-login.jpg)
![Shorten With List](./images/screenshots-shorten-with-list.jpg)
![Click History](./images/screenshots-click-history.jpg)
![Password Protected](./images/screenshots-password-protected.jpg)
![404](./images/screenshots-404.jpg)

## Features

### Frontend Admin (Next.js Project deployed on Vercel, source in /fe)

- [x] Login page: get credentials to proceed.
- [x] Shorten page: create short URLs.
- [x] List page: display short URLs in a table.
- [x] History page: view the click history for a specific short URL.

### Backend Server (Cloudflare Worker, source in root directory)

- [x] Correctly and swiftly redirect a short URL to its original long URL.
- [x] Monitor click history per link (optional; note that if enabled, it will consume many read/write times for Cloudflare KV. If you are on a paid plan, forget it because of the unlimited read/write times. But keep in mind that KV is designed more for read rather than write, so inconsistency may exist).
- [x] Expiration time supported.
- [x] Password protection supported.
- [x] 404 Not Found fallback page.

## Prerequisites

You must have:

1. A Vercel account.
2. A Cloudflare account.
3. A domain (the shorter, the better). If the domain is managed by Cloudflare, later operations will be much easier.

## Deployment

Fork this repo and clone it to your local machine. Then start the deployment process.

### Frontend Admin

The frontend code is in /fe, which is a Next.js project. Vercel is highly recommended.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLikenttt%2Fcloudflare-worker-short-url&env=CLOUDFLARE_WORKER_BASE_URL&envDescription=The%20base%20url%20you%20want%20to%20use%20for%20your%20short%20url.%20&project-name=cloudflare-worker-short-url&repository-name=cloudflare-worker-short-url&demo-title=li2niu-cloudflare-worker-short-url&demo-url=https%3A%2F%2Fcf-url-admin.li2niu.com)

If you want google analytics, remember to add the following env **NEXT_PUBLIC_GA_MEASUREMENT_ID=< your ga4 key e.g G-xxxxxxxxxx>**

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-xxxxxxxxxx
```

![Add the env variable as shorturl also backend server endpoint](images/add-cf-base-url-env.jpg)
![Change the default root](./images/change-nextjs-project-root-2-fe.jpg)
![Redeployment](./images/redeployment.jpg)

### Backend Server

#### Initialize Cloudflare KV namespace

Fill in the KV namespace ID in `wrangler.toml` below. It is not necessary to name your namespace `LINKS` because it is just a global variable exposed to the worker.

```
[[kv_namespaces]]
binding = "LINKS"
id = "7f0bf9809c464f51871b753cdda2c124" ## Change it to yours
```

![Create namespace](./images/create-kv-namespace.jpg)
![Get namespace id](./images/kv-namespace-id.jpg)

#### Create a worker service

![Create a worker service](./images/create-a-worker-service.jpg)

#### Add environment variables.

![Create Environment Variables](./images/edit-env-vars.jpg)
Don't expose your vars in `wrangler.toml`

```
USERNAME = "li2niu" # Change it and don't expose it in this file
PASSWORD = "li2niu" # Change it and don't expose it in this file
JWT_SECRET = "li2niu" # Change it and don't expose it in this file
DEFAULT_PAGE = "https://blog.li2niu.com" # Change it
RECORD_CLICKS = true
FE_ADMIN_DOMAIN = "https://cf-url-admin.li2niu.com" # Replace it with your admin domain, important for cross-origin allowlist

```

#### Clone your repo to local

```
git clone yourrepo
```

#### Install Wrangler CLI Locally and Log in to Cloudflare

```
npm install -g wrangler
wrangler login
```

#### Deploy

```
wrangler publish
```

Create your short URL in the frontend admin. Enjoy!

### Notices

#### Security

Use a long, difficult-to-guess username, password, and JWT secret for security.

#### Cloudflare Free Plan Limits

Cloudflare free plan has [limits](https://developers.cloudflare.com/workers/platform/limits/#kv-limits) for KV, especially write times. Even in a paid plan, the write speed for the same key is limited to 1 time/second, potentially causing inaccuracies in high concurrency. Click history is not recommended for **free plan** users.

#### Vercel Limits

Vercel has limits for free users, but it is unlikely to be easily overused.

### Support the Project

<a href="https://www.buymeacoffee.com/lichuanyi" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

### Credits

- Vercel
- GPT-4
- Cloudflare

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Likenttt/eastlake-cloudflare-worker-short-url&type=Date)](https://star-history.com/#Likenttt/eastlake-cloudflare-worker-short-url&Date)
