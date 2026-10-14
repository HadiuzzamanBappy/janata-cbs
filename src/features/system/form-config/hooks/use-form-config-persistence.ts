import * as React from "react";
import type { FormConfigRecord, FormSection } from "@/lib/data-schemas/form-config-schema";
import { useWorkbenchStore } from "@/store";
import type { CbsScreenMode } from "@/types";

export const INITIAL_FORM_CONFIG: FormConfigRecord = {
  recordId: "",
  title: "",
  targetModel: "",
  version: "1.0.0",
  description: "",
  isActive: true,
  presentation: {
    steps: [],
    sections: [],
  },
};

export function useFormConfigPersistence(initialId?: string, tabId?: string) {
  const { tabs, updateFormData, updateTabState } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  const resolvedInitialId = React.useMemo(() => {
    if (initialId?.trim()) return initialId.trim();
    if (currentTab?.searchRecordId) return currentTab.searchRecordId;
    return "";
  }, [initialId, currentTab?.searchRecordId]);

  const resolvedInitialMode = React.useMemo<CbsScreenMode>(() => {
    if (currentTab?.screenMode) return currentTab.screenMode;
    return "IDLE";
  }, [currentTab?.screenMode]);

  const [recordId, setRecordId] = React.useState<string>(resolvedInitialId);
  const [mode, setMode] = React.useState<CbsScreenMode>(resolvedInitialMode);
  const [formData, setFormData] = React.useState<FormConfigRecord>(() => {
    const raw = (currentTab?.formData as unknown as FormConfigRecord) || INITIAL_FORM_CONFIG;
    if (!raw.presentation?.sections) return raw;
    return {
      ...raw,
      presentation: {
        ...raw.presentation,
        sections: raw.presentation.sections.map((sec) => ({
          ...sec,
          type: (sec.type || (sec.bindKey ? "object-group" : "standard")) as FormSection["type"],
          columns: sec.columns || 1,
        })),
      },
    };
  });

  const setRecordIdWithSync = React.useCallback(
    (newId: string) => {
      setRecordId(newId);
      if (tabId) {
        updateTabState(tabId, { searchRecordId: newId });
      }
    },
    [tabId, updateTabState],
  );

  const setModeWithSync = React.useCallback(
    (newMode: CbsScreenMode) => {
      setMode(newMode);
      if (tabId) {
        updateTabState(tabId, { screenMode: newMode });
      }
    },
    [tabId, updateTabState],
  );

  // Sync debounced form data to Zustand tab store
  React.useEffect(() => {
    if (!tabId) return;
    const timer = setTimeout(() => {
      updateFormData(tabId, formData as unknown as Record<string, unknown>);
    }, 300);
    return () => clearTimeout(timer);
  }, [tabId, formData, updateFormData]);

  return {
    recordId,
    setRecordId: setRecordIdWithSync,
    mode,
    setMode: setModeWithSync,
    formData,
    setFormData,
    resolvedInitialId,
    resolvedInitialMode,
  };
}
