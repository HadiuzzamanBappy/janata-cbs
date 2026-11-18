"use client";

import { createContext, type ReactNode, useEffect } from "react";
import { cbsAuth } from "@/lib/cbs-client";
import { registerCommandAdapter } from "@/lib/cbs-command";
import { logger } from "@/lib/core-logger";
import { isApiSuccess } from "@/lib/data-schemas";
import { useLazyStore, useScopedStore } from "../scoped-store";
import { createSessionStore, type SessionState, type SessionStore } from "./session-store";

let sessionFetchPromise: Promise<unknown> | null = null;

const SessionStoreContext = createContext<SessionStore | null>(null);

export function SessionStoreProvider({ children }: { children: ReactNode }) {
  const store = useLazyStore(createSessionStore);

  useEffect(() => {
    // Universal session hydration across all windows & popups (deduplicated against React StrictMode & multiple mounts)
    if (!store.getState().user) {
      if (!sessionFetchPromise) {
        sessionFetchPromise = cbsAuth
          .getSession()
          .then((json) => {
            const user = json.data;
            if (isApiSuccess(json) && user) {
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
    });
  }, [store]);

  return <SessionStoreContext.Provider value={store}>{children}</SessionStoreContext.Provider>;
}

export function useSessionStore<T>(selector: (state: SessionState) => T): T;
export function useSessionStore(): SessionState;
export function useSessionStore(selector?: (state: SessionState) => unknown): unknown {
  return useScopedStore(SessionStoreContext, "SessionStore", selector);
}
