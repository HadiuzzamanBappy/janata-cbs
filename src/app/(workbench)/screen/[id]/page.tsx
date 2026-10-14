"use client";

import { useParams, useSearchParams } from "next/navigation";
import * as React from "react";
import { ScreenLoader } from "@/features/workbench";
import type { CbsScreenMode } from "@/lib/cbs-screen";
import { CBS_SCREEN_EVENT, CBS_SCREEN_MESSAGE, makePopupTabId } from "@/lib/cbs-screen";
import { CbsAppStoreProvider, useWorkbenchStore } from "@/store";

function StandaloneScreenContent({ rawId }: { rawId: string }) {
  const searchParams = useSearchParams();
  const { tabs, addTab } = useWorkbenchStore();
  const screenId = decodeURIComponent(rawId);

  // Canonical popup tab ID — consistent with any caller that references this popup
  const tabId = React.useMemo(() => makePopupTabId(screenId), [screenId]);

  // Hydrate popup tab state on initial mount from query parameters
  const isHydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (isHydratedRef.current) return;
    isHydratedRef.current = true;

    const existingTab = tabs.find((t) => t.id === tabId);
    if (!existingTab) {
      const mode = (searchParams.get("mode") as CbsScreenMode) || "IDLE";
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

  // Listen for dock-to-shell triggers from screen action toolbar
  React.useEffect(() => {
    const handleDock = () => {
      if (typeof window === "undefined" || !window.opener) return;
      const currentTab = tabs.find((t) => t.id === tabId);
      window.opener.postMessage(
        {
          type: CBS_SCREEN_MESSAGE.DOCK_TAB,
          payload: {
            screenId,
            title: currentTab?.title || searchParams.get("title") || screenId,
            componentName: currentTab?.componentName || "DYNAMIC_FORM",
            screenMode: currentTab?.screenMode,
            searchRecordId: currentTab?.searchRecordId,
            formData: currentTab?.formData,
            enquiryState: currentTab?.enquiryState,
          },
        },
        window.location.origin,
      );
      window.close();
    };

    window.addEventListener(CBS_SCREEN_EVENT.DOCK_TO_SHELL, handleDock);
    return () => window.removeEventListener(CBS_SCREEN_EVENT.DOCK_TO_SHELL, handleDock);
  }, [screenId, searchParams, tabId, tabs]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground antialiased select-none">
      {/* Screen Canvas Container (Takes 100% viewport height cleanly) */}
      <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col bg-background">
        <ScreenLoader
          command={
            searchParams.get("component") === "INQUIRY_SCREEN" &&
            !screenId.toUpperCase().startsWith("INQ ")
              ? `INQ ${screenId}`
              : screenId
          }
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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-screen w-screen bg-background" />;
  }

  return (
    <CbsAppStoreProvider>
      <React.Suspense fallback={null}>
        <StandaloneScreenContent rawId={rawId} />
      </React.Suspense>
    </CbsAppStoreProvider>
  );
}
