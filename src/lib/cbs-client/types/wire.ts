import type { CbsRecordFunction } from "@/types";

/**
 * Standard routing key for Core CBS Engine host.
 */
export const DEFAULT_SERVICE_PATH = "default" as const;

/**
 * Universal browser-to-proxy wire payload for CBS operations.
 * Next.js proxy route automatically enriches this with branchCode, userId, and clientId.
 */
export interface CbsWirePayload<TData = Record<string, unknown>> {
  servicePath?: string;
  requestType: string;
  controlName?: string;
  recordFunction?: CbsRecordFunction | string;
  recordId?: string;
  authLevel?: number;
  data?: TData;
}
