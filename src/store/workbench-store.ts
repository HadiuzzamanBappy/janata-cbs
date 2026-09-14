import { create } from "zustand";

export interface WorkbenchTab {
  id: string;
  title: string;
  icon?: string;
  componentName: string;
  props?: Record<string, unknown>;
}

interface WorkbenchState {
  tabs: WorkbenchTab[];
  activeTabId: string | null;
  addTab: (tab: WorkbenchTab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  closeAllTabs: () => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  tabs: [],
  activeTabId: null,
  addTab: (tab) =>
    set((state) => {
      const exists = state.tabs.find((t) => t.id === tab.id);
      if (exists) {
        return { activeTabId: tab.id };
      }
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      };
    }),
  removeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      const newActive =
        state.activeTabId === id
          ? newTabs[newTabs.length - 1]?.id ?? null
          : state.activeTabId;
      return { tabs: newTabs, activeTabId: newActive };
    }),
  setActiveTab: (id) => set({ activeTabId: id }),
  closeAllTabs: () => set({ tabs: [], activeTabId: null }),
}));
