"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";
import {
  createFormKernelStore,
  type FormKernelState,
  type FormKernelStore,
} from "./form-kernel-store";

export const FormKernelContext = createContext<FormKernelStore | null>(null);

export interface FormKernelProviderProps {
  children: ReactNode;
  initialValues?: Record<string, unknown>;
  onFieldChange?: (field: string, value: unknown) => void;
}

export function FormKernelProvider({
  children,
  initialValues = {},
  onFieldChange,
}: FormKernelProviderProps) {
  const storeRef = useRef<FormKernelStore | null>(null);

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

  return (
    <FormKernelContext.Provider value={storeRef.current}>{children}</FormKernelContext.Provider>
  );
}

/**
 * Universal hook to access the Form Kernel store with selective subscription.
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
 */
export function useFormKernelStore(): FormKernelStore {
  const store = useContext(FormKernelContext);
  if (!store) {
    throw new Error("useFormKernelStore must be used within a FormKernelProvider");
  }
  return store;
}
