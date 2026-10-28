"use client";

import { useCbsPersistence } from "@/components/cbs-screen";
import {
  type InquiryConfigRecord,
  inquiryConfigRecordSchema,
} from "@/lib/data-schemas/inquiry-config-schema";

export const INITIAL_INQUIRY_CONFIG: InquiryConfigRecord = {
  description: "",
  pageOrientation: "Portrait",
  showSerial: true,
  showPagination: true,
  showBranchWise: false,
  recordPerPage: 30,
  inqType: "DFT",
  controllerName: "",
  rptControllerName: "",
  inqServicePath: "default",
  columns: [],
  filters: [],
  actions: [],
};

export function useInquiryConfigPersistence(initialId?: string, tabId?: string) {
  return useCbsPersistence<InquiryConfigRecord>({
    initialId,
    tabId,
    initialData: INITIAL_INQUIRY_CONFIG,
    schema: inquiryConfigRecordSchema,
    fallbackMode: "IDLE",
  });
}
