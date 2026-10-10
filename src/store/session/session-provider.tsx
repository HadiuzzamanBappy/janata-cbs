"use client";

import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { useStore } from "zustand";
import { registerCommandAdapter } from "@/lib/cbs-command";
import { createSessionStore, type SessionState, type SessionStore } from "./session-store";

let activeSessionStore: SessionStore | null = null;

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
