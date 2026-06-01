import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdminPage } from "@/lib/auth";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { listLinks } from "@/lib/links";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShortenPage({ searchParams }: PageProps) {
  await requireAdminPage();
  const env = getCloudflareEnv();
  const params = await searchParams;
  const initialLongUrl = readFirst(params.url) ?? readFirst(params.longUrl) ?? "";
  const links = await listLinks(env, env.APP_BASE_URL);

  return <AdminDashboard initialLinks={links} initialLongUrl={initialLongUrl} />;
}
