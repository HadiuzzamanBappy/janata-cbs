import { create } from "zustand";

export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertMessage {
  id: string;
  type: AlertType;
  message: string;
  title?: string;
}

interface AlertState {
  alerts: AlertMessage[];
  showAlert: (alert: Omit<AlertMessage, "id">) => void;
  dismissAlert: (id: string) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  showAlert: (alert) => {
    // Generate an ID for the alert
    const id = typeof crypto !== "undefined" && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(7);
      
    set((state) => ({
      alerts: [...state.alerts, { ...alert, id }],
    }));
  },
  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),
}));
