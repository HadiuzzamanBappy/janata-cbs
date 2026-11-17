"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  CBS_SCREEN_MESSAGE,
  getTabInstanceId,
  getWorkbenchBus,
  type WorkbenchBusMessage,
} from "@/lib/cbs-screen";
import { clientConfig } from "@/lib/core-config";
import { cbsStorage } from "@/lib/core-utils";

// Window-level singleton state for this browser tab
let isOverriddenState = false;
let isCoordinatorInitialized = false;
const subscribers = new Set<() => void>();

function notifySubscribers(): void {
  for (const subscriber of subscribers) {
    subscriber();
  }
}

function setOverridden(value: boolean): void {
  if (isOverriddenState !== value) {
    isOverriddenState = value;
    notifySubscribers();
  }
}

/**
 * Broadcast leadership claim across all tabs
 */
export function claimLeadership(tabId?: string): void {
  if (typeof window === "undefined") return;
  const id = tabId || getTabInstanceId();
  if (!id) return;

  cbsStorage.set("local", clientConfig.storage.local.activeTabInstance, id);

  const bus = getWorkbenchBus();
  if (bus) {
    bus.postMessage({
      type: CBS_SCREEN_MESSAGE.CLAIM_ACTIVE_TAB,
      tabId: id,
    } satisfies WorkbenchBusMessage);
  }

  setOverridden(false);
}

function initSingleTabCoordinator(): void {
  if (typeof window === "undefined" || isCoordinatorInitialized) return;
  isCoordinatorInitialized = true;

  const myId = getTabInstanceId();

  // Claim leadership on initial workbench mount
  claimLeadership(myId);

  // 1. Listen to BroadcastChannel for peer tab leadership claims
  const bus = getWorkbenchBus();
  if (bus) {
    bus.addEventListener("message", (event: MessageEvent<WorkbenchBusMessage>) => {
      if (
        event.data?.type === CBS_SCREEN_MESSAGE.CLAIM_ACTIVE_TAB &&
        event.data.tabId &&
        event.data.tabId !== myId
      ) {
        setOverridden(true);
      }
    });
  }

  // 2. Listen to localStorage storage events (fires across different tabs in same browser)
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key === clientConfig.storage.local.activeTabInstance) {
      if (e.newValue && e.newValue !== myId) {
        setOverridden(true);
      } else if (e.newValue === myId) {
        setOverridden(false);
      }
    }
  });

  // 3. Re-verify leadership when window regains focus
  window.addEventListener("focus", () => {
    const currentActive = cbsStorage.get("local", clientConfig.storage.local.activeTabInstance);
    if (!currentActive) {
      claimLeadership(myId);
    } else if (currentActive !== myId) {
      setOverridden(true);
    } else {
      setOverridden(false);
    }
  });
}

function subscribe(callback: () => void): () => void {
  initSingleTabCoordinator();
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function getSnapshot(): boolean {
  return isOverriddenState;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Hook to enforce client-side single active tab leadership (Temenos Transact style).
 *
 * All consumers within the same tab share a single coordinator, preventing intra-tab
 * race conditions or duplicate ID generation.
 *
 * When another tab opens or reclaims leadership, this tab is marked as `isOverridden = true`.
 * Calling `takeOver()` claims leadership back and overrides other tabs.
 */
export function useSingleTab() {
  const isOverridden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const takeOver = useCallback(() => {
    claimLeadership();
  }, []);

  return {
    isOverridden,
    takeOver,
  };
}
