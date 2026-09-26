import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

export interface WorkbenchTab {
  id: string; // Unique instance ID for every tab opened
  screenId?: string; // Base screen or command ID
  title: string; // Clean screen title without count string
  instanceNumber: number; // 1-based count number: 1, 2, 3...
  icon?: string;
  componentName: string;
  props?: Record<string, unknown>;
  formData?: Record<string, unknown>; // Draft form input values typed by user
}

export interface WorkbenchState {
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
  updateFormData: (tabId: string, data: Record<string, unknown>) => void;
}

export type WorkbenchStore = ReturnType<typeof createWorkbenchStore>;

export const createWorkbenchStore = () => {
  return createStore<WorkbenchState>()(
    persist(
      (set) => ({
        tabs: [],
        activeTabId: null,
        addTab: (tab) =>
          set((state) => {
            const baseId = tab.id || tab.screenId || "screen";
            const cleanTitle = tab.title.replace(/\s*\(\d+\)$/, "").replace(/\s*#\d+$/, "");

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
        updateFormData: (tabId, data) =>
          set((state) => ({
            tabs: state.tabs.map((tab) =>
              tab.id === tabId ? { ...tab, formData: { ...tab.formData, ...data } } : tab,
            ),
          })),
      }),

      {
        name: "cbs_workbench_tabs_store",
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  );
};
