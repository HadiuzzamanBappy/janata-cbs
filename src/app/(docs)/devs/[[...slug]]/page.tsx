// Devs Documentation Dynamic Page
import { DocViewer } from "@/features/docs/server";

export const dynamic = "force-dynamic";

export default async function DevsDocPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return <DocViewer portal="devs" slug={slug} />;
}
