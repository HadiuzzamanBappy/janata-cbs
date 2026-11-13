"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CBS_SCREEN_MESSAGE, getWorkbenchBus, type WorkbenchBusMessage } from "@/lib/cbs-screen";
import { clientConfig } from "@/lib/core-config";
import { generateIdempotencyKey } from "@/lib/core-utils";

/**
 * Hook to enforce client-side single active tab leadership (Temenos Transact style).
 *
 * When another tab opens or reclaims leadership, this tab is marked as `isOverridden = true`.
 * Calling `takeOver()` claims leadership back and overrides other tabs.
 */
export function useSingleTab() {
  const [isOverridden, setIsOverridden] = useState(false);
  const tabInstanceIdRef = useRef<string>("");

  // Retrieve or generate ephemeral tab instance ID (stable across reloads in same tab, fresh on duplicate)
  const getInstanceId = useCallback((): string => {
    if (typeof window === "undefined") return "";

    let isReload = false;
    if (typeof performance !== "undefined") {
      const navEntries = performance.getEntriesByType("navigation");
      isReload =
        navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === "reload";
    }

    // Only reuse sessionStorage ID if this is an explicit page reload (F5)
    let id = isReload ? sessionStorage.getItem(clientConfig.storage.session.tabInstanceId) : null;

    if (!id) {
      id = `tab_${generateIdempotencyKey().slice(0, 12)}`;
      sessionStorage.setItem(clientConfig.storage.session.tabInstanceId, id);
    }
    return id;
  }, []);

  // Broadcast leadership claim across all tabs
  const claimLeadership = useCallback((id: string) => {
    if (typeof window === "undefined" || !id) return;
    localStorage.setItem(clientConfig.storage.local.activeTabInstance, id);
    const bus = getWorkbenchBus();
    if (bus) {
      bus.postMessage({
        type: CBS_SCREEN_MESSAGE.CLAIM_ACTIVE_TAB,
        tabId: id,
      } satisfies WorkbenchBusMessage);
    }
    setIsOverridden(false);
  }, []);

  // Re-claim leadership when user clicks "Take Over Session Here"
  const takeOver = useCallback(() => {
    const myId = tabInstanceIdRef.current || getInstanceId();
    tabInstanceIdRef.current = myId;
    claimLeadership(myId);
  }, [claimLeadership, getInstanceId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const myId = getInstanceId();
    tabInstanceIdRef.current = myId;

    // Claim active leadership on mount
    claimLeadership(myId);

    // Listen to BroadcastChannel for peer tab leadership claims
    const bus = getWorkbenchBus();
    const handleBusMessage = (event: MessageEvent<WorkbenchBusMessage>) => {
      if (
        event.data?.type === CBS_SCREEN_MESSAGE.CLAIM_ACTIVE_TAB &&
        event.data.tabId &&
        event.data.tabId !== myId
      ) {
        setIsOverridden(true);
      }
    };

    if (bus) {
      bus.addEventListener("message", handleBusMessage);
    }

    // Listen to localStorage storage events (fires across different tabs in same browser)
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === clientConfig.storage.local.activeTabInstance &&
        e.newValue &&
        e.newValue !== myId
      ) {
        setIsOverridden(true);
      }
    };
    window.addEventListener("storage", handleStorage);

    // Check leadership when window regains focus
    const handleFocus = () => {
      const currentActive = localStorage.getItem(clientConfig.storage.local.activeTabInstance);
      if (currentActive && currentActive !== myId) {
        setIsOverridden(true);
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      if (bus) {
        bus.removeEventListener("message", handleBusMessage);
      }
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [claimLeadership, getInstanceId]);

  return {
    isOverridden,
    takeOver,
  };
}
