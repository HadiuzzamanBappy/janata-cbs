import type { CbsRecordFunction } from "@/types";

/**
 * Standard default routing key for Core CBS Engine host.
 */
export const DEFAULT_SERVICE_PATH = "default" as const;

/**
 * Universal browser-to-proxy wire payload for CBS operations.
 *
 * Next.js proxy route (`/api/proxy`) receives this envelope and enriches it
 * with session identity (branchCode, userId, clientId) before gRPC forwarding.
 */
export interface CbsWirePayload<TData = Record<string, unknown>> {
  /** Target gRPC service cluster/path (defaults to "default") */
  servicePath?: string;
  /** Operation verb / request type identifier (e.g., "GET", "PUT", "INQ", "AUT") */
  requestType: string;
  /** Table / Model / Controller identifier (e.g., "ACCOUNT", "USER.GROUP", "MENU") */
  controlName?: string;
  /** Action function verb (e.g. 'I' for Input, 'S' for See, 'A' for Authorize, 'D' for Delete) */
  recordFunction?: CbsRecordFunction | string;
  /** Primary record identifier or query key */
  recordId?: string;
  /** Authorization tier required for the operation (defaults to 1) */
  authLevel?: number;
  /** Structured payload data object */
  data?: TData;
}
