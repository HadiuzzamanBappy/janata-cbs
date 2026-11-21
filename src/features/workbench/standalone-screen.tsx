"use client";

import { Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import * as React from "react";
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
import {
  type CurrentUser,
  filterCriteriaMapSchema,
  isApiSuccess,
  popupSearchParamsSchema,
} from "@/lib/data-schemas";
import { useSessionStore, useWorkbenchStore } from "@/store";
import { CBS_IDLE_MODE, CBS_SCREEN_COMPONENTS } from "@/types";
import { ScreenLoader } from "./loader";

/**
 * Detached popup screen: rebuilds its tab from the validated URL plus the staged draft, follows
 * session state over the workbench bus, and docks back to the main shell on request.
 *
 * NOTE ON SESSION TIMEOUT: the idle-timeout watcher runs only in the main shell. Popups share its
 * authenticated cookie session and only report activity, so no duplicate countdown appears here.
 */
export function StandaloneScreen({ screenId }: { screenId: string }) {
  const searchParams = useSearchParams();
  const url = React.useMemo(
    () => popupSearchParamsSchema.safeParse(Object.fromEntries(searchParams)).data ?? {},
    [searchParams],
  );
  const { tabs, addTab } = useWorkbenchStore();
  const { user, clearSession, setSession } = useSessionStore();
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
        clearSession();
      } else if (type === CBS_SCREEN_MESSAGE.SESSION_RESTORED) {
        setIsSessionExpired(false);
        if (event.data?.payload) {
          setSession(event.data.payload as CurrentUser);
        }
      }
    };

    bus.addEventListener("message", handleMessage);
    return () => bus.removeEventListener("message", handleMessage);
  }, [clearSession, setSession]);

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
          clearSession();
        }
      })
      .catch(() => {
        setIsSessionExpired(true);
        clearSession();
      });
  }, [clearSession]);

  // Read clean tabId passed from popup dispatcher or fallback to canonical ID
  const tabId = url.tabId || makePopupTabId(screenId);

  // Passive activity reporting keeps the main shell's idle timer alive (no countdown in popups)
  useActivityReporter();

  // Hydrate popup tab state on initial mount from shared storage (supporting 150 - 1,000 fields)
  const isHydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (isHydratedRef.current) return;
    isHydratedRef.current = true;

    if (!tabs.some((t) => t.id === tabId)) {
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
        title: url.title || screenId,
        componentName: url.component || CBS_SCREEN_COMPONENTS.DYNAMIC_FORM,
        screenMode: url.mode || CBS_IDLE_MODE,
        searchRecordId: url.recordId || "",
        formData: storageDraft || undefined,
        isDirty: Boolean(storageDraft),
        inquiryState: {
          step: url.step,
          criteria,
          currentPage: url.page,
        },
      });
    }
  }, [addTab, screenId, url, tabId, tabs]);

  // Listen for dock-to-shell triggers from screen action toolbar (using BroadcastChannel)
  React.useEffect(() => {
    const handleDock = () => {
      const currentTab = tabs.find((t) => t.id === tabId);
      const payload = {
        screenId,
        title: currentTab?.title || url.title || screenId,
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
  }, [screenId, url.title, tabId, tabs]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground antialiased select-none">
      {/* Screen Canvas Container: Shows lock screen whenever session is inactive or timed out */}
      {isSessionExpired ? (
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
              url.component === CBS_SCREEN_COMPONENTS.INQUIRY_SCREEN &&
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
