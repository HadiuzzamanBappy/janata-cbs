"use client";

import { type Context, useContext, useRef } from "react";
import { type StoreApi, useStore } from "zustand";

/** Creates a provider-scoped store exactly once per provider instance. */
export function useLazyStore<A>(create: () => A): A {
  const storeRef = useRef<A | null>(null);
  if (!storeRef.current) storeRef.current = create();
  return storeRef.current;
}

/** Reads a provider-scoped store: the whole state, or a selected slice. `owner` names it in errors, e.g. "AlertStore". */
export function useScopedStore<S, A extends StoreApi<S> = StoreApi<S>>(
  context: Context<A | null>,
  owner: string,
  selector?: (state: S) => unknown,
): unknown {
  const store = useContext(context);
  if (!store) throw new Error(`use${owner} must be used within ${owner}Provider`);
  return useStore(store, selector ?? ((state: S) => state));
}
