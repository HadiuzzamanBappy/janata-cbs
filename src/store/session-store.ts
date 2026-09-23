import { createStore } from "zustand/vanilla";
import type { UserDetails } from "@/features/auth";

export interface SessionState {
  user: UserDetails | null;
  currentBranch: string | null;
  isAuthenticated: boolean;
  setSession: (user: UserDetails) => void;
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
        await fetch("/api/logout", { method: "POST" });
      } catch (e) {
        console.error("Logout failed", e);
      }
      set({ user: null, isAuthenticated: false });
      window.location.href = "/login";
    },
    setBranch: (branch) => set({ currentBranch: branch }),
  }));
};
