import { create } from "zustand";

export interface WorkbenchTab {
  id: string; // Unique instance ID for every tab opened
  screenId?: string; // Base screen or command ID
  title: string; // Clean screen title without count string
  instanceNumber: number; // 1-based count number: 1, 2, 3...
  icon?: string;
  componentName: string;
  props?: Record<string, unknown>;
}

interface WorkbenchState {
  tabs: WorkbenchTab[];
  activeTabId: string | null;
  addTab: (
    tab: Omit<WorkbenchTab, "id" | "instanceNumber"> & {
      id?: string;
      instanceNumber?: number;
    },
  ) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  closeAllTabs: () => void;
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  tabs: [],
  activeTabId: null,
  addTab: (tab) =>
    set((state) => {
      const baseId = tab.id || tab.screenId || "screen";
      const cleanTitle = tab.title
        .replace(/\s*\(\d+\)$/, "")
        .replace(/\s*#\d+$/, "");

      // Count how many instances of this same screen are currently open
      const sameScreenCount = state.tabs.filter(
        (t) => (t.screenId || t.id) === baseId || t.title === cleanTitle,
      ).length;

      const instanceNumber = sameScreenCount + 1;
      const uniqueInstanceId = `${baseId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const newTab: WorkbenchTab = {
        ...tab,
        id: uniqueInstanceId,
        screenId: baseId,
        title: cleanTitle,
        instanceNumber,
      };

      return {
        tabs: [...state.tabs, newTab],
        activeTabId: uniqueInstanceId,
      };
    }),
  removeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      const newActive =
        state.activeTabId === id
          ? (newTabs[newTabs.length - 1]?.id ?? null)
          : state.activeTabId;
      return { tabs: newTabs, activeTabId: newActive };
    }),
  setActiveTab: (id) => set({ activeTabId: id }),
  closeAllTabs: () => set({ tabs: [], activeTabId: null }),
}));
