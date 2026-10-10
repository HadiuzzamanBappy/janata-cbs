"use client";

import { useParams, useSearchParams } from "next/navigation";
import * as React from "react";
import { ScreenLoader } from "@/features/workbench";
import {
  AlertStoreProvider,
  SessionStoreProvider,
  useWorkbenchStore,
  WorkbenchStoreProvider,
} from "@/store";

function StandaloneScreenContent({ rawId }: { rawId: string }) {
  const searchParams = useSearchParams();
  const { tabs, addTab } = useWorkbenchStore();
  const screenId = decodeURIComponent(rawId);

  // Synthesize or reuse a tabId for standalone popup window persistence
  const tabId = React.useMemo(() => {
    return `popup-${screenId.replace(/\s+/g, "_")}`;
  }, [screenId]);

  // Hydrate popup tab state on initial mount from query parameters
  const isHydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (isHydratedRef.current) return;
    isHydratedRef.current = true;

    const existingTab = tabs.find((t) => t.id === tabId);
    if (!existingTab) {
      const mode = (searchParams.get("mode") as "IDLE" | "CREATE" | "EDIT" | "VIEW") || "IDLE";
      const recordId = searchParams.get("recordId") || "";
      const title = searchParams.get("title") || screenId;
      const component = searchParams.get("component") || "DYNAMIC_FORM";
      const step = searchParams.get("step") as "SELECTION" | "RESULTS" | undefined;
      const pageStr = searchParams.get("page");
      const pageSizeStr = searchParams.get("pageSize");

      let criteria: Record<string, { value: string; operand: string }> | undefined;
      try {
        const critJson = searchParams.get("criteria");
        if (critJson) criteria = JSON.parse(critJson);
      } catch {
        // Safe fallback
      }

      let formData: Record<string, unknown> | undefined;
      try {
        const dataJson = searchParams.get("data");
        if (dataJson) formData = JSON.parse(dataJson);
      } catch {
        // Safe fallback
      }

      addTab({
        id: tabId,
        screenId,
        title,
        componentName: component,
        screenMode: mode,
        searchRecordId: recordId,
        formData,
        enquiryState: {
          step,
          criteria,
          currentPage: pageStr ? Number(pageStr) : undefined,
          pageSize: pageSizeStr ? Number(pageSizeStr) : undefined,
        },
      });
    }
  }, [addTab, screenId, searchParams, tabId, tabs]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground antialiased select-none">
      {/* Screen Canvas Container (Takes 100% viewport height cleanly) */}
      <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col bg-background">
        <ScreenLoader
          command={screenId}
          tabId={tabId}
          mode="window"
          className="flex-1 h-full min-h-0"
        />
      </main>
    </div>
  );
}

export default function StandaloneScreenPage() {
  const params = useParams();
  const rawId = (params?.id as string) ?? "ACCOUNT";

  return (
    <SessionStoreProvider>
      <WorkbenchStoreProvider>
        <AlertStoreProvider>
          <React.Suspense fallback={null}>
            <StandaloneScreenContent rawId={rawId} />
          </React.Suspense>
        </AlertStoreProvider>
      </WorkbenchStoreProvider>
    </SessionStoreProvider>
  );
}
