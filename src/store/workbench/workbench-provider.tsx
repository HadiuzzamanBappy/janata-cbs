"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";
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
