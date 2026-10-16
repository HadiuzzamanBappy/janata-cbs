"use client";

import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { useStore } from "zustand";
import { registerCommandAdapter } from "@/lib/cbs-command";
import { CBS_SCREEN_MESSAGE } from "@/lib/cbs-screen";
import { createWorkbenchStore, type WorkbenchState, type WorkbenchStore } from "./workbench-store";

let activeWorkbenchStore: WorkbenchStore | null = null;

export function getActiveWorkbenchStore(): WorkbenchStore | null {
  return activeWorkbenchStore;
}

export const WorkbenchStoreContext = createContext<WorkbenchStore | null>(null);

export interface WorkbenchStoreProviderProps {
  children: ReactNode;
}

export const WorkbenchStoreProvider = ({ children }: WorkbenchStoreProviderProps) => {
  const storeRef = useRef<WorkbenchStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createWorkbenchStore();
    activeWorkbenchStore = storeRef.current;
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    const handleMessage = (e: MessageEvent) => {
      if (typeof window !== "undefined" && e.origin !== window.location.origin) return;
      if (e.data?.type === CBS_SCREEN_MESSAGE.DOCK_TAB && e.data?.payload) {
        store.getState().addTab(e.data.payload);
        window.focus();
      }
    };

    window.addEventListener("message", handleMessage);

    // Subscribe to BroadcastChannel bus for robust cross-window communication
    let busUnsubscribe: (() => void) | undefined;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bus = new BroadcastChannel("cbs_workbench_bus");
      bus.onmessage = (event) => {
        if (event.data?.type === "CBS_DOCK_TAB" && event.data?.payload) {
          store.getState().addTab(event.data.payload);
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
  }, []);

  return (
    <WorkbenchStoreContext.Provider value={storeRef.current}>
      {children}
    </WorkbenchStoreContext.Provider>
  );
};

export function useWorkbenchStore<T>(selector: (state: WorkbenchState) => T): T;
export function useWorkbenchStore(): WorkbenchState;
export function useWorkbenchStore<T>(selector?: (state: WorkbenchState) => T) {
  const workbenchStoreContext = useContext(WorkbenchStoreContext);

  if (!workbenchStoreContext) {
    throw new Error(`useWorkbenchStore must be used within WorkbenchStoreProvider`);
  }

  return useStore(workbenchStoreContext, selector ?? ((state) => state as unknown as T));
}
