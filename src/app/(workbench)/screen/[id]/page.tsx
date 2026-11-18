"use client";

import { Lock } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import * as React from "react";
import { ScreenLoader } from "@/features/workbench";
import { useActivityReporter } from "@/hooks";
import { cbsAuth } from "@/lib/cbs-client";
import {
  broadcastDockTab,
  CBS_SCREEN_EVENT,
  CBS_SCREEN_MESSAGE,
  getWorkbenchBus,
  getWorkbenchDraft,
  makePopupTabId,
  type WorkbenchBusMessage,
} from "@/lib/cbs-screen";
import { clientConfig } from "@/lib/core-config";
import { cbsStorage } from "@/lib/core-utils";
import { filterCriteriaMapSchema, isApiSuccess } from "@/lib/data-schemas";
import { CbsAppStoreProvider, useSessionStore, useWorkbenchStore } from "@/store";
import {
  CBS_IDLE_MODE,
  CBS_SCREEN_COMPONENTS,
  type CbsInquiryStep,
  type CbsScreenMode,
} from "@/types";

function StandaloneScreenContent({ rawId }: { rawId: string }) {
  const searchParams = useSearchParams();
  const { tabs, addTab } = useWorkbenchStore();
  const screenId = decodeURIComponent(rawId);
  const { user } = useSessionStore();
  const [isSessionExpired, setIsSessionExpired] = React.useState(false);

  // Cross-window session coordination for detached popup screens
  React.useEffect(() => {
    const bus = getWorkbenchBus();
    if (!bus) return;

    const handleMessage = (event: MessageEvent<WorkbenchBusMessage>) => {
      const type = event.data?.type;
      if (
        type === CBS_SCREEN_MESSAGE.SESSION_EXPIRED ||
        type === CBS_SCREEN_MESSAGE.SESSION_LOGOUT
      ) {
        setIsSessionExpired(true);
      } else if (
        type === CBS_SCREEN_MESSAGE.SESSION_RESTORED ||
        type === CBS_SCREEN_MESSAGE.SESSION_LOGIN
      ) {
        setIsSessionExpired(false);
      }
    };

    bus.addEventListener("message", handleMessage);
    return () => bus.removeEventListener("message", handleMessage);
  }, []);

  // Clear expired state whenever user is restored or active in store
  React.useEffect(() => {
    if (user) {
      setIsSessionExpired(false);
    }
  }, [user]);

  // Check active session on initial mount / page reload
  React.useEffect(() => {
    cbsAuth
      .getSession()
      .then((res) => {
        if (!isApiSuccess(res) || !res.data) {
          setIsSessionExpired(true);
        }
      })
      .catch(() => {
        setIsSessionExpired(true);
      });
  }, []);

  // Read clean tabId passed from popup dispatcher or fallback to canonical ID
  const urlTabId = searchParams.get("tabId");
  const tabId = React.useMemo(() => urlTabId || makePopupTabId(screenId), [urlTabId, screenId]);

  // Passive activity reporting keeps the main shell's idle timer alive (no countdown in popups)
  useActivityReporter();

  // Hydrate popup tab state on initial mount from shared storage (supporting 150 - 1,000 fields)
  const isHydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (isHydratedRef.current) return;
    isHydratedRef.current = true;

    const existingTab = tabs.find((t) => t.id === tabId);
    if (!existingTab) {
      const mode = (searchParams.get("mode") as CbsScreenMode) || CBS_IDLE_MODE;
      const recordId = searchParams.get("recordId") || "";
      const title = searchParams.get("title") || screenId;
      const component = searchParams.get("component") || CBS_SCREEN_COMPONENTS.DYNAMIC_FORM;
      const step = searchParams.get("step") as CbsInquiryStep | undefined;
      const pageStr = searchParams.get("page");
      const pageSizeStr = searchParams.get("pageSize");

      // Read large payload from session storage draft (supports 1,000 fields with zero URL overflow)
      const storageDraft = getWorkbenchDraft(tabId);

      const criteria =
        cbsStorage.readJson(
          "session",
          clientConfig.storage.session.criteria(tabId),
          filterCriteriaMapSchema,
        ) ?? undefined;

      addTab({
        id: tabId,
        screenId,
        title,
        componentName: component,
        screenMode: mode,
        searchRecordId: recordId,
        formData: storageDraft || undefined,
        isDirty: Boolean(storageDraft),
        inquiryState: {
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
        componentName: currentTab?.componentName || CBS_SCREEN_COMPONENTS.DYNAMIC_FORM,
        screenMode: currentTab?.screenMode,
        searchRecordId: currentTab?.searchRecordId,
        formData: currentTab?.formData,
        baseline: currentTab?.baseline,
        isDirty: currentTab?.isDirty,
        inquiryState: currentTab?.inquiryState,
      };

      // 1. Broadcast via native BroadcastChannel (immune to F5 and cross-origin null openers)
      broadcastDockTab(tabId, payload);

      // 2. Fallback to postMessage only if BroadcastChannel is unavailable
      if (typeof window !== "undefined" && !("BroadcastChannel" in window)) {
        try {
          const win = window as Window;
          if (win.opener) {
            win.opener.postMessage(
              {
                type: CBS_SCREEN_MESSAGE.DOCK_TAB,
                payload,
              },
              win.location.origin,
            );
          }
        } catch {
          // Handled
        }
      }

      window.close();
    };

    window.addEventListener(CBS_SCREEN_EVENT.DOCK_TO_SHELL, handleDock);
    return () => window.removeEventListener(CBS_SCREEN_EVENT.DOCK_TO_SHELL, handleDock);
  }, [screenId, searchParams, tabId, tabs]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground antialiased select-none">
      {/* Screen Canvas Container: Shows lock screen on unauthenticated fresh load, or keeps form visible if user has active draft */}
      {isSessionExpired &&
      !tabs.some((t) => t.id === tabId && t.formData && Object.keys(t.formData).length > 0) ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10">
          <div className="size-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mb-3">
            <Lock className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Session Inactive</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">
            Your banking session has timed out. Please log in on your main browser tab to continue
            using this screen.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 text-xs font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
          >
            Check Session & Refresh
          </button>
        </div>
      ) : !tabs.some((t) => t.id === tabId) ? null : (
        // Mount the screen only once its tab exists: the screen reads the draft from the tab at mount
        <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col bg-background">
          <ScreenLoader
            command={
              searchParams.get("component") === CBS_SCREEN_COMPONENTS.INQUIRY_SCREEN &&
              !screenId.toUpperCase().startsWith("INQ ")
                ? `INQ ${screenId}`
                : screenId
            }
            tabId={tabId}
            mode="window"
            className="flex-1 h-full min-h-0"
          />
        </main>
      )}
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
 * authenticated cookie session, passively updating lastActivity without rendering
 * duplicate modal countdown triggers.
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
