"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import {
  createWorkbenchStore,
  type WorkbenchStore,
  type WorkbenchState,
} from "@/store/workbench-store";

export const WorkbenchStoreContext = createContext<WorkbenchStore | null>(null);

export interface WorkbenchStoreProviderProps {
  children: ReactNode;
}

export const WorkbenchStoreProvider = ({ children }: WorkbenchStoreProviderProps) => {
  const storeRef = useRef<WorkbenchStore>(undefined!);
  if (!storeRef.current) {
    storeRef.current = createWorkbenchStore();
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

  return useStore(workbenchStoreContext, selector ?? ((state) => state as any));
}
