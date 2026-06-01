import { hashPassword } from "@/lib/crypto";
import type { CreateLinkInput, HistoryPoint, LinkRecord, LinkStats, PublicLink } from "@/lib/types";

const LINK_PREFIX = "link:";
const STATS_PREFIX = "stats:";
const DAY_PREFIX = "click-day:";
const SLUG_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export const LINK_KEYS = {
  link: (slug: string) => `${LINK_PREFIX}${slug}`,
  stats: (slug: string) => `${STATS_PREFIX}${slug}`,
  day: (slug: string, date: string) => `${DAY_PREFIX}${slug}:${date}`,
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export function buildShortUrl(baseUrl: string, slug: string) {
  return `${normalizeBaseUrl(baseUrl)}/${encodeURIComponent(slug)}`;
}

function ensureValidUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }

    return url.toString();
  } catch {
    throw new Error("请输入有效的 http 或 https 链接");
  }
}

function normalizeSlug(slug: string) {
  const value = slug.trim();
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(value)) {
    throw new Error("短链后缀只能包含字母、数字、下划线或短横线，最长 64 位");
  }

  return value;
}

function normalizeLength(value: number | undefined) {
  if (!value) {
    return 6;
  }

  if (!Number.isInteger(value) || value < 3 || value > 24) {
    throw new Error("随机短链长度需要在 3 到 24 位之间");
  }

  return value;
}

function generateSlug(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let slug = "";
  for (const byte of bytes) {
    slug += SLUG_ALPHABET[byte % SLUG_ALPHABET.length];
  }

  return slug;
}

async function readJson<T>(namespace: KVNamespace, key: string) {
  return namespace.get<T>(key, "json");
}

export async function getLink(env: CloudflareEnv, slug: string) {
  return readJson<LinkRecord>(env.LINKS, LINK_KEYS.link(slug));
}

export async function getLinkStats(env: CloudflareEnv, slug: string) {
  const stats = await readJson<LinkStats>(env.LINKS, LINK_KEYS.stats(slug));
  return stats ?? { slug, total: 0 };
}

export async function listLinks(env: CloudflareEnv, baseUrl: string) {
  let cursor: string | undefined;
  const records: LinkRecord[] = [];

  do {
    const page = await env.LINKS.list({ prefix: LINK_PREFIX, cursor });
    const links = await Promise.all(page.keys.map((key) => readJson<LinkRecord>(env.LINKS, key.name)));
    records.push(...links.filter((link): link is LinkRecord => Boolean(link)));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const withStats = await Promise.all(
    records.map(async (record): Promise<PublicLink> => {
      const stats = await getLinkStats(env, record.slug);
      return {
        ...record,
        shortUrl: buildShortUrl(baseUrl, record.slug),
        clicks: stats.total,
        lastClickedAt: stats.lastClickedAt,
      };
    }),
  );

  return withStats.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function createLink(env: CloudflareEnv, input: CreateLinkInput, baseUrl: string) {
  const now = new Date();
  const longUrl = ensureValidUrl(input.longUrl.trim());
  const length = normalizeLength(input.shortUrlLength);
  const slug = input.slug?.trim() ? normalizeSlug(input.slug) : await createUniqueSlug(env, length);
  const existing = await getLink(env, slug);

  if (existing) {
    throw new Error("这个短链后缀已存在");
  }

  const expiresAt =
    input.expirationMinutes && input.expirationMinutes > 0
      ? new Date(now.getTime() + input.expirationMinutes * 60 * 1000).toISOString()
      : undefined;

  const record: LinkRecord = {
    id: crypto.randomUUID(),
    slug,
    longUrl,
    passwordHash: input.password?.trim() ? await hashPassword(input.password) : undefined,
    expiresAt,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const options =
    expiresAt == null
      ? undefined
      : {
          expirationTtl: Math.max(60, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)),
        };

  await env.LINKS.put(LINK_KEYS.link(slug), JSON.stringify(record), options);

  return {
    ...record,
    shortUrl: buildShortUrl(baseUrl, slug),
    clicks: 0,
  } satisfies PublicLink;
}

async function createUniqueSlug(env: CloudflareEnv, length: number) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slug = generateSlug(length);
    if (!(await getLink(env, slug))) {
      return slug;
    }
  }

  throw new Error("短链后缀生成失败，请稍后重试或指定自定义后缀");
}

export async function deleteLink(env: CloudflareEnv, slug: string) {
  await Promise.all([env.LINKS.delete(LINK_KEYS.link(slug)), env.LINKS.delete(LINK_KEYS.stats(slug))]);
}

export async function getClickHistory(env: CloudflareEnv, slug: string, days = 30) {
  const today = new Date();
  const dates = Array.from({ length: days }, (_, offset) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (days - offset - 1));
    return date.toISOString().slice(0, 10);
  });

  const values = await Promise.all(dates.map((date) => env.LINKS.get(LINK_KEYS.day(slug, date))));

  return dates.map((date, index): HistoryPoint => {
    const clicks = Number(values[index] ?? 0);
    return { date, clicks: Number.isFinite(clicks) ? clicks : 0 };
  });
}
