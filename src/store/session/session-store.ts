import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { appConfig } from "@/lib/core-config";
import { logger } from "@/lib/core-logger";
import type { CurrentUser } from "@/lib/data-schemas";

export interface SessionState {
  user: CurrentUser | null;
  currentBranch: string | null;
  isAuthenticated: boolean;
  setSession: (user: CurrentUser) => void;
  clearSession: () => void;

  logout: () => Promise<void>;
  setBranch: (branch: string) => void;
}

export type SessionStore = ReturnType<typeof createSessionStore>;

export const createSessionStore = () => {
  return createStore<SessionState>()(
    persist(
      (set) => ({
        user: null,
        currentBranch: null,
        isAuthenticated: false,
        setSession: (user) => set({ user, isAuthenticated: true }),
        clearSession: () => set({ user: null, isAuthenticated: false }),
        logout: async () => {
          try {
            await fetch(appConfig.routes.api.logout, { method: "POST" });
          } catch (e) {
            logger.error("Logout failed", e, "SESSION_STORE");
          }
          set({ user: null, isAuthenticated: false });

          // Cross-window coordination: notify detached windows without wiping draft form data
          if (typeof window !== "undefined") {
            try {
              const channel = new BroadcastChannel(appConfig.storage.broadcast.workbenchBus);
              channel.postMessage({ type: "SESSION_LOGOUT" });
              channel.close();
            } catch {
              // Ignore BroadcastChannel errors in non-supporting contexts
            }
            window.location.href = appConfig.routes.login;
          }
        },
        setBranch: (branch) => {
          set({ currentBranch: branch });
          // Broadcast branch change to detached popups
          if (typeof window !== "undefined") {
            try {
              const channel = new BroadcastChannel(appConfig.storage.broadcast.workbenchBus);
              channel.postMessage({ type: "BRANCH_CHANGED", branch });
              channel.close();
            } catch {
              // Safe fallback
            }
          }
        },
      }),
      {
        name: appConfig.storage.session.sessionState,
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  );
};
