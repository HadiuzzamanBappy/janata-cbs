"use client";

import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { useStore } from "zustand";
import { registerCommandAdapter } from "@/lib/cbs-command";
import { appConfig } from "@/lib/core-config";
import { logger } from "@/lib/core-logger";
import { createSessionStore, type SessionState, type SessionStore } from "./session-store";

let activeSessionStore: SessionStore | null = null;
let sessionFetchPromise: Promise<unknown> | null = null;

export function getActiveSessionStore(): SessionStore | null {
  return activeSessionStore;
}

export const SessionStoreContext = createContext<SessionStore | null>(null);

export interface SessionStoreProviderProps {
  children: ReactNode;
}

export const SessionStoreProvider = ({ children }: SessionStoreProviderProps) => {
  const storeRef = useRef<SessionStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createSessionStore();
    activeSessionStore = storeRef.current;
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    // Universal session hydration across all windows & popups (deduplicated against React StrictMode & multiple mounts)
    if (!store.getState().user) {
      if (!sessionFetchPromise) {
        sessionFetchPromise = fetch(appConfig.routes.api.session)
          .then((res) => res.json())
          .then((json) => {
            const user = json.data || json.currUser;
            if (json.success && user) {
              store.getState().setSession(user);
              if (user.branchCode && !store.getState().currentBranch) {
                store.getState().setBranch(user.branchCode);
              }
            }
          })
          .catch((err) => logger.error("Failed to hydrate session", err, "SESSION_PROVIDER"))
          .finally(() => {
            sessionFetchPromise = null;
          });
      }
    }

    return registerCommandAdapter({
      getCurrentUser: () => store.getState().user,
      logout: () => store.getState().logout(),
    });
  }, []);

  return (
    <SessionStoreContext.Provider value={storeRef.current}>{children}</SessionStoreContext.Provider>
  );
};

export function useSessionStore<T>(selector: (state: SessionState) => T): T;
export function useSessionStore(): SessionState;
export function useSessionStore<T>(selector?: (state: SessionState) => T) {
  const sessionStoreContext = useContext(SessionStoreContext);

  if (!sessionStoreContext) {
    throw new Error(`useSessionStore must be used within SessionStoreProvider`);
  }

  return useStore(sessionStoreContext, selector ?? ((state) => state as unknown as T));
}
