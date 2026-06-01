export type AppEnv = CloudflareEnv & {
  ADMIN_PASSWORD: string;
  AUTH_SECRET: string;
};
