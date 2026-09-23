"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import {
  createAlertStore,
  type AlertStore,
  type AlertState,
} from "@/store/alert-store";

export const AlertStoreContext = createContext<AlertStore | null>(null);

export interface AlertStoreProviderProps {
  children: ReactNode;
}

export const AlertStoreProvider = ({ children }: AlertStoreProviderProps) => {
  const storeRef = useRef<AlertStore>(undefined!);
  if (!storeRef.current) {
    storeRef.current = createAlertStore();
  }

  return (
    <AlertStoreContext.Provider value={storeRef.current}>
      {children}
    </AlertStoreContext.Provider>
  );
};

export function useAlertStore<T>(selector: (state: AlertState) => T): T;
export function useAlertStore(): AlertState;
export function useAlertStore<T>(selector?: (state: AlertState) => T) {
  const alertStoreContext = useContext(AlertStoreContext);

  if (!alertStoreContext) {
    throw new Error(`useAlertStore must be used within AlertStoreProvider`);
  }

  return useStore(alertStoreContext, selector ?? ((state) => state as any));
}
