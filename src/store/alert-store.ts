import { createStore } from "zustand/vanilla";

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
}

export interface AlertState {
  // Confirm Dialog State
  isConfirmOpen: boolean;
  confirmOptions: ConfirmDialogOptions | null;
  
  // Actions
  confirm: (options: ConfirmDialogOptions) => void;
  closeConfirm: () => void;
}

export type AlertStore = ReturnType<typeof createAlertStore>;

export const createAlertStore = () => {
  return createStore<AlertState>()((set) => ({
    isConfirmOpen: false,
    confirmOptions: null,

    confirm: (options) =>
      set({
        isConfirmOpen: true,
        confirmOptions: options,
      }),

    closeConfirm: () =>
      set({
        isConfirmOpen: false,
      }),
  }));
};
