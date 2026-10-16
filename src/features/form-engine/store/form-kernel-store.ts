/**
 * High-Performance Atomized Form Kernel Store
 *
 * Implements fine-grained per-field subscriptions for 150 - 1,000 field banking forms.
 * Typing into a field updates only that field's subscribers.
 * Zero whole-form re-renders.
 */

import { createStore } from "zustand/vanilla";

export interface FormKernelState {
  values: Record<string, unknown>;
  initialValues: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  visibility: Record<string, boolean>;
  readOnly: Record<string, boolean>;
  isDirty: boolean;
  submitting: boolean;

  // Actions
  setValue: (field: string, value: unknown) => void;
  setValues: (values: Record<string, unknown>) => void;
  setError: (field: string, error: string | null) => void;
  setErrors: (errors: Record<string, string>) => void;
  setTouched: (field: string, isTouched?: boolean) => void;
  setVisibility: (field: string, visible: boolean) => void;
  setReadOnly: (field: string, readOnly: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  resetForm: (newValues?: Record<string, unknown>) => void;
}

export type FormKernelStore = ReturnType<typeof createFormKernelStore>;

export function createFormKernelStore(initialValues: Record<string, unknown> = {}) {
  return createStore<FormKernelState>()((set, get) => ({
    values: { ...initialValues },
    initialValues: { ...initialValues },
    errors: {},
    touched: {},
    visibility: {},
    readOnly: {},
    isDirty: false,
    submitting: false,

    setValue: (field: string, value: unknown) => {
      set((state) => {
        // Fast-path: don't mutate if identical primitive
        if (state.values[field] === value) return state;

        const nextValues = { ...state.values, [field]: value };
        const nextErrors = { ...state.errors };
        if (nextErrors[field]) {
          delete nextErrors[field];
        }

        return {
          values: nextValues,
          errors: nextErrors,
          touched: { ...state.touched, [field]: true },
          isDirty: true,
        };
      });
    },

    setValues: (newValues: Record<string, unknown>) => {
      set({
        values: { ...newValues },
        isDirty: false,
        errors: {},
      });
    },

    setError: (field: string, error: string | null) => {
      set((state) => {
        if (!error && !state.errors[field]) return state;
        const next = { ...state.errors };
        if (error) {
          next[field] = error;
        } else {
          delete next[field];
        }
        return { errors: next };
      });
    },

    setErrors: (errors: Record<string, string>) => {
      set({ errors: { ...errors } });
    },

    setTouched: (field: string, isTouched = true) => {
      set((state) => ({
        touched: { ...state.touched, [field]: isTouched },
      }));
    },

    setVisibility: (field: string, visible: boolean) => {
      set((state) => {
        if (state.visibility[field] === visible) return state;
        return { visibility: { ...state.visibility, [field]: visible } };
      });
    },

    setReadOnly: (field: string, readOnly: boolean) => {
      set((state) => {
        if (state.readOnly[field] === readOnly) return state;
        return { readOnly: { ...state.readOnly, [field]: readOnly } };
      });
    },

    setSubmitting: (submitting: boolean) => {
      set({ submitting });
    },

    resetForm: (newValues?: Record<string, unknown>) => {
      const target = newValues ?? get().initialValues;
      set({
        values: { ...target },
        initialValues: { ...target },
        errors: {},
        touched: {},
        isDirty: false,
        submitting: false,
      });
    },
  }));
}
