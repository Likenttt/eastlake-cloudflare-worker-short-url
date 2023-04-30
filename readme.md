# East Lake short url system based on cloudflare workers(as the backend server) & Vercel(as the admin)

## Experience it https://cf-url-admin.li2niu.com/

- username: li2niu
- password: li2niu
  Don't delete the data that has many clicks :)

## Short Url Examples:

- https://u.li2niu.com/468
- https://u.li2niu.com/tcK
- https://u.li2niu.com/666 (For 404)

## File Archtecture

Server side(root dir)

- [ x ] A page with authentication used to create short urls
- [ x ] Correctly and swiftly redirect a short url to its destination
- [ x ] Monitor the click history for per links
- [ x ] Expiration time for short urls
- [ x ] Redirect merely after authentication passed
- [ x ]

CLient Side Admin(/fe)

## Quick Start

### Part One (Server Side)

1. Clone this repo to your local
2. Initialize your Cloudflare KV space and environment variables

```
USERNAME = "li2niu" # Change it
PASSWORD = "li2niu" # Change it
JWT_SECRET = "li2niu" # Change it
DEFAULT_PAGE = "https://li2niu.com" # Change it
RECORD_CLICKS = true
```

3. Initialize wrangler config
4. Deploy
5. Create your short url in Cloudflare kv namespace.

### Part Two (Client Side, Optional)

1. Deploy this [Client Pages EastLake-Short-Url](https://github.com/Likenttt/EastLake-Short-Url) to Vercel or other platforms like cloudflare
2. Configure your environment variables
3. Login,create your short urls, view click histories and so on~
