import { HistoryPanel } from "@/components/history-panel";
import { requireAdminPage } from "@/lib/auth";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { getClickHistory, getLinkStats, listLinks } from "@/lib/links";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HistoryPage({ searchParams }: PageProps) {
  await requireAdminPage();
  const env = getCloudflareEnv();
  const params = await searchParams;
  const links = await listLinks(env, env.APP_BASE_URL);
  const selectedSlug = readFirst(params.slug) ?? links[0]?.slug ?? "";
  const selectedLink = links.find((link) => link.slug === selectedSlug);
  const [stats, history] = selectedLink
    ? await Promise.all([getLinkStats(env, selectedLink.slug), getClickHistory(env, selectedLink.slug)])
    : [{ slug: selectedSlug, total: 0 }, []];

  return <HistoryPanel initialLinks={links} initialSlug={selectedSlug} initialStats={stats} initialHistory={history} />;
}
