# A short url system based on cloudflare workers

Server side

- [ x ] A page with authentication used to create short urls
- [ ] Correctly and swiftly redirect a short url to its destination
- [ ] Monitor the click history for per links
- [ ] Expiration time for short urls
- [ ] Redirect merely after authentication passed
- [ ]

## Quick Start

### Part One (Server Side)

1. Clone this repo to your local
2. Initialize your Cloudflare KV space and environment variables(USERNAME/PASSWORD/JWT_SECRET)
3. Initialize wrangler config
4. Deploy
5. Create your short url in Cloudflare kv namespace.

### Part Two (Client Side, Optional)

1. Deploy this [Client Pages EastLake-Short-Url](https://github.com/Likenttt/EastLake-Short-Url) to Vercel or other platforms like cloudflare
2. Configure your environment variables
3. Login,create your short urls, view click histories and so on~
