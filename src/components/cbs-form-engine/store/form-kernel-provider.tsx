/**
 * @fileoverview Form Kernel Context & Selective Subscription Hooks
 * @module form-engine/store/form-kernel-provider
 *
 * Core Invariants:
 * - Scopes an isolated FormKernelStore instance per form/tab lifecycle.
 * - Provides selective subscription hook (useFormKernel) to avoid whole-form re-renders.
 * - Synchronizes incoming async initialValues without clearing local operator edits.
 */

"use client";

import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { useStore } from "zustand";
import {
  createFormKernelStore,
  type FormKernelState,
  type FormKernelStore,
} from "./form-kernel-store";

// ─────────────────────────────────────────────────────────────────────────────
// Context & Provider
// ─────────────────────────────────────────────────────────────────────────────

export const FormKernelContext = createContext<FormKernelStore | null>(null);

export interface FormKernelProviderProps {
  children: ReactNode;
  initialValues?: Record<string, unknown>;
  onFieldChange?: (field: string, value: unknown) => void;
}

/**
 * Provides an isolated FormKernelStore instance to child form components.
 *
 * @param props.children Child form tree.
 * @param props.initialValues Initial seed values dictionary.
 * @param props.onFieldChange Optional change callback for tab persistence.
 */
export function FormKernelProvider({
  children,
  initialValues = {},
  onFieldChange,
}: FormKernelProviderProps) {
  const storeRef = useRef<FormKernelStore | null>(null);
  const prevSyncValuesRef = useRef<Record<string, unknown>>(initialValues);

  if (!storeRef.current) {
    storeRef.current = createFormKernelStore(initialValues);

    // Optional listener to propagate to tab persistence
    if (onFieldChange) {
      let prevValues = { ...initialValues };
      storeRef.current.subscribe((state) => {
        for (const [key, val] of Object.entries(state.values)) {
          if (val !== prevValues[key]) {
            queueMicrotask(() => {
              onFieldChange(key, val);
            });
          }
        }
        prevValues = { ...state.values };
      });
    }
  }

  // Reactively synchronize kernel store when initialValues arrive asynchronously (e.g. from CBS API fetch)
  useEffect(() => {
    if (!storeRef.current) return;
    if (initialValues && initialValues !== prevSyncValuesRef.current) {
      prevSyncValuesRef.current = initialValues;
      const currentKernelValues = storeRef.current.getState().values;
      if (Object.keys(initialValues).length > 0) {
        storeRef.current.getState().setValues({
          ...currentKernelValues,
          ...initialValues,
        });
      }
    }
  }, [initialValues]);

  return (
    <FormKernelContext.Provider value={storeRef.current}>{children}</FormKernelContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Selective Subscription Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Universal hook to access the Form Kernel store with selective subscription.
 * Component re-renders ONLY when the selected slice changes.
 *
 * @example
 * const val = useFormKernel((s) => s.values.accountNumber);
 *
 * @param selector Selective mapping function from FormKernelState.
 * @returns Selected state slice.
 */
export function useFormKernel<T>(selector: (state: FormKernelState) => T): T {
  const store = useContext(FormKernelContext);
  if (!store) {
    throw new Error("useFormKernel must be used within a FormKernelProvider");
  }
  return useStore(store, selector);
}

/**
 * Direct access to the FormKernelStore instance without subscribing to state changes.
 * Useful for invoking actions inside callbacks without re-rendering.
 *
 * @returns The underlying FormKernelStore instance.
 */
export function useFormKernelStore(): FormKernelStore {
  const store = useContext(FormKernelContext);
  if (!store) {
    throw new Error("useFormKernelStore must be used within a FormKernelProvider");
  }
  return store;
}
