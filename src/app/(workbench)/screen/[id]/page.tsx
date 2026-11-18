"use client";

import { notFound, useParams } from "next/navigation";
import * as React from "react";
import { StandaloneScreen } from "@/features/workbench";
import { popupRouteParamsSchema } from "@/lib/data-schemas";
import { CbsAppStoreProvider } from "@/store";

/** Detached popup window for multi-monitor work (`/screen/[id]`). */
export default function StandaloneScreenPage() {
  const params = popupRouteParamsSchema.safeParse(useParams());
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!params.success) notFound();
  if (!mounted) {
    return <div className="h-screen w-screen bg-background" />;
  }

  return (
    <CbsAppStoreProvider>
      <React.Suspense fallback={null}>
        <StandaloneScreen screenId={decodeURIComponent(params.data.id)} />
      </React.Suspense>
    </CbsAppStoreProvider>
  );
}
