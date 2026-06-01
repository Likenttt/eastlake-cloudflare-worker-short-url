import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AppEnv } from "@/lib/env";

type CloudflareRuntime = {
  env: AppEnv;
  ctx: ExecutionContext;
};

export function getCloudflareEnv() {
  return getCloudflareContext().env as AppEnv;
}

export function getCloudflareRuntime() {
  return getCloudflareContext() as unknown as CloudflareRuntime;
}
