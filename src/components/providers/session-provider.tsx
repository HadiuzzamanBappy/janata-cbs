"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import {
  createSessionStore,
  type SessionStore,
  type SessionState,
} from "@/store/session-store";

export const SessionStoreContext = createContext<SessionStore | null>(null);

export interface SessionStoreProviderProps {
  children: ReactNode;
}

export const SessionStoreProvider = ({ children }: SessionStoreProviderProps) => {
  const storeRef = useRef<SessionStore>(undefined!);
  if (!storeRef.current) {
    storeRef.current = createSessionStore();
  }

  return (
    <SessionStoreContext.Provider value={storeRef.current}>
      {children}
    </SessionStoreContext.Provider>
  );
};

export function useSessionStore<T>(selector: (state: SessionState) => T): T;
export function useSessionStore(): SessionState;
export function useSessionStore<T>(selector?: (state: SessionState) => T) {
  const sessionStoreContext = useContext(SessionStoreContext);

  if (!sessionStoreContext) {
    throw new Error(`useSessionStore must be used within SessionStoreProvider`);
  }

  return useStore(sessionStoreContext, selector ?? ((state) => state as any));
}
