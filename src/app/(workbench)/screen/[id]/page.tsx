"use client";

import { useParams, useSearchParams } from "next/navigation";
import * as React from "react";
import { ScreenLoader } from "@/features/workbench";
import {
  broadcastDockTab,
  CBS_SCREEN_EVENT,
  CBS_SCREEN_MESSAGE,
  getWorkbenchDraft,
  makePopupTabId,
} from "@/lib/cbs-screen";
import { clientConfig } from "@/lib/core-config";
import { CbsAppStoreProvider, useWorkbenchStore } from "@/store";
import type { CbsScreenMode } from "@/types";

function StandaloneScreenContent({ rawId }: { rawId: string }) {
  const searchParams = useSearchParams();
  const { tabs, addTab } = useWorkbenchStore();
  const screenId = decodeURIComponent(rawId);

  // Read clean tabId passed from popup dispatcher or fallback to canonical ID
  const urlTabId = searchParams.get("tabId");
  const tabId = React.useMemo(() => urlTabId || makePopupTabId(screenId), [urlTabId, screenId]);

  // Hydrate popup tab state on initial mount from shared storage (supporting 150 - 1,000 fields)
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

      // Read large payload from session storage draft (supports 1,000 fields with zero URL overflow)
      const storageDraft = getWorkbenchDraft(tabId);

      let criteria: Record<string, { value: string; operand: string }> | undefined;
      const storageCrit =
        typeof window !== "undefined"
          ? sessionStorage.getItem(clientConfig.storage.session.criteria(tabId))
          : null;
      if (storageCrit) {
        try {
          criteria = JSON.parse(storageCrit);
        } catch {
          // Safe fallback
        }
      }

      addTab({
        id: tabId,
        screenId,
        title,
        componentName: component,
        screenMode: mode,
        searchRecordId: recordId,
        formData: storageDraft || undefined,
        enquiryState: {
          step,
          criteria,
          currentPage: pageStr ? Number(pageStr) : undefined,
          pageSize: pageSizeStr ? Number(pageSizeStr) : undefined,
        },
      });
    }
  }, [addTab, screenId, searchParams, tabId, tabs]);

  // Listen for dock-to-shell triggers from screen action toolbar (using BroadcastChannel)
  React.useEffect(() => {
    const handleDock = () => {
      const currentTab = tabs.find((t) => t.id === tabId);
      const payload = {
        screenId,
        title: currentTab?.title || searchParams.get("title") || screenId,
        componentName: currentTab?.componentName || "DYNAMIC_FORM",
        screenMode: currentTab?.screenMode,
        searchRecordId: currentTab?.searchRecordId,
        formData: currentTab?.formData,
        enquiryState: currentTab?.enquiryState,
      };

      // 1. Broadcast via native BroadcastChannel (immune to F5 and cross-origin null openers)
      broadcastDockTab(tabId, payload);

      // 2. Legacy postMessage fallback if window.opener is still alive
      if (typeof window !== "undefined" && window.opener) {
        try {
          window.opener.postMessage(
            {
              type: CBS_SCREEN_MESSAGE.DOCK_TAB,
              payload,
            },
            window.location.origin,
          );
        } catch {
          // Handled by broadcast channel
        }
      }

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

/**
 * Standalone Screen Window for detached/popup workstation views.
 *
 * NOTE ON SESSION TIMEOUT:
 * AppTimeoutWatcher is INTENTIONALLY omitted from standalone popup windows.
 * Session inactivity timeout monitoring, countdown warning modals, and session
 * teardown triggers are managed exclusively by the centralized WorkbenchShell
 * in the primary dashboard window. Detached popups operate within the same
 * authenticated cookie session without rendering duplicate modal countdown triggers.
 */
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
