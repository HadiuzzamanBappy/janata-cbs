"use client";

import { createContext, type ReactNode } from "react";
import { useLazyStore, useScopedStore } from "../scoped-store";
import { type AlertState, type AlertStore, createAlertStore } from "./alert-store";

const AlertStoreContext = createContext<AlertStore | null>(null);

export function AlertStoreProvider({ children }: { children: ReactNode }) {
  const store = useLazyStore(createAlertStore);
  return <AlertStoreContext.Provider value={store}>{children}</AlertStoreContext.Provider>;
}

export function useAlertStore<T>(selector: (state: AlertState) => T): T;
export function useAlertStore(): AlertState;
export function useAlertStore(selector?: (state: AlertState) => unknown): unknown {
  return useScopedStore(AlertStoreContext, "AlertStore", selector);
}
