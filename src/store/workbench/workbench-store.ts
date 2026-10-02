import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { appConfig } from "@/lib/config";

export interface WorkbenchTab {
  id: string; // Unique instance ID for every tab opened
  screenId?: string; // Base screen or command ID
  title: string; // Clean screen title without count string
  instanceNumber: number; // 1-based count number: 1, 2, 3...
  icon?: string;
  componentName: string;
  props?: Record<string, unknown>;
  formData?: Record<string, unknown>; // Draft form input values typed by user
  isDirty?: boolean; // True only when the user has actually edited/typed changes
  screenMode?: "IDLE" | "CREATE" | "EDIT" | "VIEW";
  searchRecordId?: string;
  enquiryState?: {
    step?: "SELECTION" | "RESULTS";
    criteria?: Record<string, { value: string; operand: string }>;
    currentPage?: number;
    pageSize?: number;
  };
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
  closeOthers: (id: string) => void;
  closeToRight: (id: string) => void;
  duplicateTab: (id: string) => void;
  updateFormData: (tabId: string, data: Record<string, unknown>) => void;
  updateTabState: (tabId: string, patch: Partial<WorkbenchTab>) => void;
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
        closeOthers: (id) =>
          set((state) => ({
            tabs: state.tabs.filter((t) => t.id === id),
            activeTabId: id,
          })),
        closeToRight: (id) =>
          set((state) => {
            const idx = state.tabs.findIndex((t) => t.id === id);
            const newTabs = idx === -1 ? state.tabs : state.tabs.slice(0, idx + 1);
            const stillActive = newTabs.some((t) => t.id === state.activeTabId);
            return {
              tabs: newTabs,
              activeTabId: stillActive
                ? state.activeTabId
                : (newTabs[newTabs.length - 1]?.id ?? null),
            };
          }),
        duplicateTab: (id) =>
          set((state) => {
            const source = state.tabs.find((t) => t.id === id);
            if (!source) return state;
            const baseId = source.screenId || source.id;
            const cleanTitle = source.title.replace(/\s*\(\d+\)$/, "").replace(/\s*#\d+$/, "");
            const sameScreenCount = state.tabs.filter(
              (t) => (t.screenId || t.id) === baseId || t.title === cleanTitle,
            ).length;
            const uniqueInstanceId = `${baseId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const newTab: WorkbenchTab = {
              ...source,
              id: uniqueInstanceId,
              instanceNumber: sameScreenCount + 1,
              formData: undefined, // fresh — no stale draft
            };
            const insertIndex = state.tabs.findIndex((t) => t.id === id) + 1;
            const newTabs = [
              ...state.tabs.slice(0, insertIndex),
              newTab,
              ...state.tabs.slice(insertIndex),
            ];
            return { tabs: newTabs, activeTabId: uniqueInstanceId };
          }),
        updateFormData: (tabId, data) =>
          set((state) => ({
            tabs: state.tabs.map((tab) =>
              tab.id === tabId ? { ...tab, formData: { ...tab.formData, ...data } } : tab,
            ),
          })),
        updateTabState: (tabId, patch) =>
          set((state) => ({
            tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, ...patch } : tab)),
          })),
      }),

      {
        name: appConfig.storageKeys.workbenchTabs,
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  );
};
