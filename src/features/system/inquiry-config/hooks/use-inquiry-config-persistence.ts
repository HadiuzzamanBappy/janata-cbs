import * as React from "react";
import type { InquiryConfigRecord } from "@/lib/data-schemas/inquiry-config-schema";
import { useWorkbenchStore } from "@/store";
import type { CbsScreenMode } from "@/types";

export const INITIAL_INQUIRY_CONFIG: InquiryConfigRecord = {
  id: "",
  title: "",
  description: "",
  pageOrientation: "Portrait",
  recordPerPage: 50,
  showSerial: true,
  showPagination: true,
  showBranchWise: false,
  inqServicePath: "",
  inquiryType: "Data From Table",
  controllerName: "",
  reportControlName: "",
  cmdFromInternal: false,
  cmdFieldName: "",
  fixedSelection: "",
  targetModel: "",
  columns: [],
  filters: [],
  actions: [],
};

export function useInquiryConfigPersistence(initialId?: string, tabId?: string) {
  const { tabs, updateFormData, updateTabState, setTabDirty } = useWorkbenchStore();
  const currentTab = tabs.find((t) => t.id === tabId);

  const resolvedInitialId = React.useMemo(() => {
    if (initialId?.trim()) return initialId.trim();
    if (currentTab?.searchRecordId) return currentTab.searchRecordId;
    return "";
  }, [initialId, currentTab?.searchRecordId]);

  const resolvedInitialMode = React.useMemo<CbsScreenMode>(() => {
    if (currentTab?.screenMode) return currentTab.screenMode;
    return "I";
  }, [currentTab?.screenMode]);

  const [recordId, setRecordId] = React.useState<string>(resolvedInitialId);
  const [mode, setMode] = React.useState<CbsScreenMode>(resolvedInitialMode);
  const [formData, setFormData] = React.useState<InquiryConfigRecord>(() => {
    const raw = (currentTab?.formData as unknown as InquiryConfigRecord) || INITIAL_INQUIRY_CONFIG;
    return {
      ...raw,
      id: raw.id || resolvedInitialId,
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

  const updateConfig = React.useCallback(
    (patch: Partial<InquiryConfigRecord>) => {
      setFormData((prev) => {
        const next = { ...prev, ...patch };
        if (tabId) {
          updateFormData(tabId, next as unknown as Record<string, unknown>);
          setTabDirty(tabId, true);
        }
        return next;
      });
    },
    [tabId, updateFormData, setTabDirty],
  );

  return {
    recordId,
    setRecordId: setRecordIdWithSync,
    mode,
    setMode: setModeWithSync,
    formData,
    setFormData,
    updateConfig,
  };
}
