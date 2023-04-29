/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    CLOUDFLARE_WORKER_BASE_URL: process.env.CLOUDFLARE_WORKER_BASE_URL,
  },
  images: {
    domains: ["github.blog"],
  },
};

module.exports = nextConfig;
