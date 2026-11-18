"use client";

import { createContext, type ReactNode, useEffect } from "react";
import { registerCommandAdapter } from "@/lib/cbs-command";
import {
  CBS_SCREEN_MESSAGE,
  clearAllWorkbenchDrafts,
  clearWorkbenchDraft,
  getTabInstanceId,
} from "@/lib/cbs-screen";
import { clientConfig } from "@/lib/core-config";
import { cbsStorage } from "@/lib/core-utils";
import { useLazyStore, useScopedStore } from "../scoped-store";
import { useSessionStore } from "../session/session-provider";
import { createWorkbenchStore, type WorkbenchState, type WorkbenchStore } from "./workbench-store";

const WorkbenchStoreContext = createContext<WorkbenchStore | null>(null);

export function WorkbenchStoreProvider({ children }: { children: ReactNode }) {
  const store = useLazyStore(createWorkbenchStore);

  // Operator isolation: keep tabs intact for same user re-auth, purge on user switch
  const currentUser = useSessionStore((state) => state.user);

  useEffect(() => {
    if (!currentUser?.userId || typeof window === "undefined") return;

    const lastUser = cbsStorage.get("session", clientConfig.storage.session.lastWorkbenchUser);
    if (lastUser && lastUser !== currentUser.userId) {
      // Different banking operator logged in: purge tabs and staged popup drafts to prevent
      // cross-user data leakage
      store.getState().closeAllTabs();
      clearAllWorkbenchDrafts();
    }
    cbsStorage.set("session", clientConfig.storage.session.lastWorkbenchUser, currentUser.userId);
  }, [currentUser?.userId, store]);

  useEffect(() => {
    // Helper to verify if this browser tab is currently the active leader
    const isThisTabActive = () => {
      if (typeof window === "undefined") return true;
      const activeInstanceId = cbsStorage.get(
        "local",
        clientConfig.storage.local.activeTabInstance,
      );
      const myInstanceId = getTabInstanceId();
      // If another tab is the active leader, this tab is inactive/overridden and must not receive dock events
      if (activeInstanceId && myInstanceId && activeInstanceId !== myInstanceId) {
        return false;
      }
      return true;
    };

    const handleMessage = (e: MessageEvent) => {
      if (typeof window !== "undefined" && e.origin !== window.location.origin) return;
      if (e.data?.type === CBS_SCREEN_MESSAGE.DOCK_TAB && e.data?.payload) {
        if (!isThisTabActive()) return;
        store.getState().addTab(e.data.payload);
        window.focus();
      }
    };

    window.addEventListener("message", handleMessage);

    // Subscribe to BroadcastChannel bus for robust cross-window communication
    let busUnsubscribe: (() => void) | undefined;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bus = new BroadcastChannel(clientConfig.storage.broadcast.workbenchBus);
      bus.onmessage = (event) => {
        if (event.data?.type === CBS_SCREEN_MESSAGE.DOCK_TAB && event.data?.payload) {
          if (!isThisTabActive()) return;
          store.getState().addTab(event.data.payload);
          clearWorkbenchDraft(event.data.tabId); // the opener's copy of this popup's hand-off
          window.focus();
        }
      };
      busUnsubscribe = () => bus.close();
    }

    const unregisterAdapter = registerCommandAdapter({
      openTab: (tab) => {
        store.getState().addTab(tab);
      },
    });

    return () => {
      window.removeEventListener("message", handleMessage);
      busUnsubscribe?.();
      unregisterAdapter?.();
    };
  }, [store]);

  return <WorkbenchStoreContext.Provider value={store}>{children}</WorkbenchStoreContext.Provider>;
}

export function useWorkbenchStore<T>(selector: (state: WorkbenchState) => T): T;
export function useWorkbenchStore(): WorkbenchState;
export function useWorkbenchStore(selector?: (state: WorkbenchState) => unknown): unknown {
  return useScopedStore(WorkbenchStoreContext, "WorkbenchStore", selector);
}
