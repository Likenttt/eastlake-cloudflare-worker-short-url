# East Lake short url system based on Cloudflare workers & Vercel [WIP]

## Experience it now https://cf-url-admin.li2niu.com/

- username: li2niu
- password: li2niu
  Don't delete the data that has many clicks :) I believe you won't

## Short Url Examples:

- https://u.li2niu.com/468
- https://u.li2niu.com/tcK
- https://u.li2niu.com/666 (For 404)

## Screenshots

![Login](./images/screenshots-login.jpg)
![Shorten With List](./images/screenshots-shorten-with-list.jpg)
![Click History](./images/screenshots-click-history.jpg)
![Password Protected](./images/screenshots-password-protected.jpg)
![404](./images/screenshots-404.jpg)

## Features

### Frontend Admin(Nextjs Project deployed on Vercel, source in /fe)

- [ x ] Login page,get credentials to proceed.
- [ x ] Shorten page, create short urls.
- [ x ] List page, display short urls in a table.
- [ x ] History page, view the click history for a specific short url.

### Backend Server(Cloudflare Worker, source in root directory)

- [ x ] Correctly and swiftly redirect a short url to its original long url
- [ x ] Monitor the click history for per link(Optional,note that if turned on,it will consume a lot write/read times for cloudflare kv. If you are in a paid plan, forget it because of the unlimited read/write times. But you must keep in mind the kv is designed more for read rather than write, in which case inconsitency may exist.)
- [ x ] Expiration time supported
- [ x ] Password protected supported
- [ x ] 404 not found fallback page

## Prequisitions

You must have

1. A Vercel account.
2. A Cloudflare account.
3. A domain. The shorter the better. If the domain is managed by Cloudflare, later operations would be much easier.

## Deployment

Fork this repo and clone it to your local machine, then start deployment.

### Frontend Admin

The Frontend code is in /fe, which is a Nextjs project. Vercel is highly recommended.
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLikenttt%2Fcloudflare-worker-short-url&env=CLOUDFLARE_WORKER_BASE_URL&envDescription=The%20base%20url%20you%20want%20to%20use%20for%20your%20short%20url.%20&project-name=cloudflare-worker-short-url&repository-name=cloudflare-worker-short-url&demo-title=li2niu-cloudflare-worker-short-url&demo-url=https%3A%2F%2Fcf-url-admin.li2niu.com)

![Add the env variable as shorturl also backend server endpoint](images/add-cf-base-url-env.jpg)
![Change the default root](./images/change-nextjs-project-root-2-fe.jpg)
![Redeployment](./images/redeployment.jpg)

### Backend Server

#### Initialize Cloudflare KV namespace

Fill in the kv namespace id in `wrangler.toml` below. It is not necessary to name your namespace `LINKS` because it is just a global variable exposed to worker.

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
FE_ADMIN_DOMAIN = "https://cf-url-admin.li2niu.com" #Remember to replace it with your admin domain, important for cross origin allowlist

```

#### Clone your repo to local

```
git clone yourrepo
```

#### Install wrangler cli locally and log in cloudflare.

```
npm install -g wrangler
wrangler login
```

#### Deploy

```
wrangler publish
```

Then create your short url in Fe amdin. Have fun~

### Notices

#### Security

Please use a long username and password that not easily guessed for security concern. Besides, use a complex JWT secret.

#### Cloudflare free plan limits

Cloudflare free plan has [limits](https://developers.cloudflare.com/workers/platform/limits/#kv-limits) for kv. Especially for the write times. Even in paid plan, the write speed for same key is limited to 1 time/second, in which case the click times may not accurate in high cocurrency. If you are in **free plan**, click history is not recommended.

#### Vercel limits

Vercel has limits for free users as well. But I don't think it is easily overused.

### Buy me coffee

<a href="https://www.buymeacoffee.com/lichuanyi" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

### Credit

- Vercel
- GPT-4
