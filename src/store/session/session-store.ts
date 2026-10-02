import { createStore } from "zustand/vanilla";
import { appConfig } from "@/lib/config";
import type { CurrentUser } from "@/lib/schemas";

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
  return createStore<SessionState>()((set) => ({
    user: null,
    currentBranch: null,
    isAuthenticated: false,
    setSession: (user) => set({ user, isAuthenticated: true }),
    clearSession: () => set({ user: null, isAuthenticated: false }),
    logout: async () => {
      try {
        await fetch(appConfig.routes.api.logout, { method: "POST" });
      } catch (e) {
        console.error("Logout failed", e);
      }
      set({ user: null, isAuthenticated: false });
      window.location.href = appConfig.routes.login;
    },
    setBranch: (branch) => set({ currentBranch: branch }),
  }));
};
