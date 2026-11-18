import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { cbsAuth } from "@/lib/cbs-client";
import {
  CBS_SCREEN_MESSAGE,
  clearAllWorkbenchDrafts,
  postWorkbenchMessage,
} from "@/lib/cbs-screen";
import { clientConfig } from "@/lib/core-config";
import { logger } from "@/lib/core-logger";
import { cbsStorage } from "@/lib/core-utils";
import type { CurrentUser } from "@/lib/data-schemas";

export interface SessionState {
  user: CurrentUser | null;
  /** Always the server session's branch (`user.branchCode`): set only from a server-confirmed user. */
  currentBranch: string | null;
  isAuthenticated: boolean;
  setSession: (user: CurrentUser) => void;
  clearSession: () => void;
  logout: () => Promise<void>;
}

export type SessionStore = ReturnType<typeof createSessionStore>;

const SIGNED_OUT = { user: null, currentBranch: null, isAuthenticated: false } as const;

export const createSessionStore = () => {
  return createStore<SessionState>()(
    persist(
      (set) => ({
        ...SIGNED_OUT,
        setSession: (user) => {
          set({ user, currentBranch: user.branchCode, isAuthenticated: true });
          postWorkbenchMessage({
            type: CBS_SCREEN_MESSAGE.SESSION_RESTORED,
            tabId: "global",
            payload: user,
          });
        },
        clearSession: () => set(SIGNED_OUT),
        logout: async () => {
          try {
            await cbsAuth.logout();
          } catch (e) {
            logger.error("Logout failed", e, "SESSION_STORE");
          }
          set(SIGNED_OUT);
          // An explicit sign-out leaves the terminal: drop open tabs and staged drafts (they can
          // hold customer data). An idle timeout keeps them so the same teller can resume.
          cbsStorage.remove("session", clientConfig.storage.session.workbenchTabs);
          clearAllWorkbenchDrafts();
          postWorkbenchMessage({ type: CBS_SCREEN_MESSAGE.SESSION_LOGOUT, tabId: "global" });
          if (typeof window !== "undefined") window.location.href = clientConfig.routes.login;
        },
      }),
      {
        name: clientConfig.storage.session.sessionState,
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  );
};
