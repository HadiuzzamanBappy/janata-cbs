"use client";

import { useCbsPersistence } from "@/components/cbs-screen";
import {
  type InquiryConfigRecord,
  inquiryConfigRecordSchema,
} from "@/lib/data-schemas/inquiry-config-schema";

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
    cmdFromInternal: null,
    cmdFieldName: null,
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
    fallbackMode: "IDLE",
  });
}

