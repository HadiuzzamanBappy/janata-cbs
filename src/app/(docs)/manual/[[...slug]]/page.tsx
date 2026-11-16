// Manual Documentation Dynamic Page
import { DocViewer } from "@/features/docs/server";

export const dynamic = "force-dynamic";

export default async function ManualDocPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return <DocViewer portal="manual" slug={slug} />;
}
