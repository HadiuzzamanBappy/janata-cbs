"use client";

import { useCbsPersistence } from "@/components/cbs-screen";
import { type InquiryConfigRecord, inquiryConfigRecordSchema } from "@/lib/data-schemas";
import { CBS_IDLE_MODE } from "@/types";

export const INITIAL_INQUIRY_CONFIG: InquiryConfigRecord = {
  INQInfo: {
    description: "",
    pageOrientation: "Portrait",
    perpageItem: "30",
    showSerial: true,
    showPagination: true,
    showBranchWise: false,
    inqType: "DFT",
    controllerName: "",
    rptControllerName: "",
    fixedSelection: "",
    inqServicePath: "default",
    cmdFromInternal: false,
    cmdFieldName: "",
  },
  INQSelectField: [],
  INQDef: [],
  INQCmds: [],
};

export function useIcPersistence(initialId?: string, tabId?: string) {
  return useCbsPersistence<InquiryConfigRecord>({
    initialId,
    tabId,
    initialData: INITIAL_INQUIRY_CONFIG,
    schema: inquiryConfigRecordSchema,
    fallbackMode: CBS_IDLE_MODE,
  });
}
