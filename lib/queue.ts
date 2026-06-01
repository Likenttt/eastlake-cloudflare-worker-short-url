import { LINK_KEYS, getLinkStats } from "@/lib/links";
import type { ClickEvent, LinkStats } from "@/lib/types";

function dateKey(value: string) {
  return value.slice(0, 10);
}

function isClickEvent(value: unknown): value is ClickEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Partial<ClickEvent>;
  return typeof event.slug === "string" && typeof event.at === "string";
}

async function incrementNumber(env: CloudflareEnv, key: string, amount: number, expirationTtl?: number) {
  const current = Number((await env.LINKS.get(key)) ?? 0);
  const next = Number.isFinite(current) ? current + amount : amount;
  await env.LINKS.put(key, String(next), expirationTtl ? { expirationTtl } : undefined);
}

export async function consumeClickEvents(batch: MessageBatch<ClickEvent>, env: CloudflareEnv) {
  const slugCounts = new Map<string, { count: number; lastClickedAt: string }>();
  const dayCounts = new Map<string, number>();

  for (const message of batch.messages) {
    if (!isClickEvent(message.body)) {
      continue;
    }

    const event = message.body;
    const existing = slugCounts.get(event.slug);
    const lastClickedAt = !existing || event.at > existing.lastClickedAt ? event.at : existing.lastClickedAt;
    slugCounts.set(event.slug, { count: (existing?.count ?? 0) + 1, lastClickedAt });

    const day = `${event.slug}:${dateKey(event.at)}`;
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }

  await Promise.all([
    ...Array.from(slugCounts.entries()).map(async ([slug, update]) => {
      const current = await getLinkStats(env, slug);
      const next: LinkStats = {
        slug,
        total: current.total + update.count,
        lastClickedAt: update.lastClickedAt > (current.lastClickedAt ?? "") ? update.lastClickedAt : current.lastClickedAt,
      };
      await env.LINKS.put(LINK_KEYS.stats(slug), JSON.stringify(next));
    }),
    ...Array.from(dayCounts.entries()).map(([compoundKey, amount]) => {
      const separatorIndex = compoundKey.lastIndexOf(":");
      const slug = compoundKey.slice(0, separatorIndex);
      const date = compoundKey.slice(separatorIndex + 1);
      return incrementNumber(env, LINK_KEYS.day(slug, date), amount, 400 * 24 * 60 * 60);
    }),
  ]);
}
