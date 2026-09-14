import { create } from "zustand";

export interface UserSession {
  id: string;
  username: string;
  role: string;
}

interface SessionState {
  user: UserSession | null;
  currentBranch: string | null;
  isAuthenticated: boolean;
  setSession: (user: UserSession) => void;
  clearSession: () => void;
  setBranch: (branch: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  currentBranch: null,
  isAuthenticated: false,
  setSession: (user) => set({ user, isAuthenticated: true }),
  clearSession: () => set({ user: null, isAuthenticated: false }),
  setBranch: (branch) => set({ currentBranch: branch }),
}));
