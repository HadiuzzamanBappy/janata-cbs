/**
 * Universal API Transport Contracts for CBS Core Banking
 */

export type ApiStatus = "SUCCESS" | "FAIL" | "ERROR" | "RECORD_NOT_FOUND";

export interface ApiResponse<T = unknown> {
  status: ApiStatus | (string & {});
  statusCode?: number;
  idempotencyKey?: string;
  message?: string;
  errors?: string[];
  timestamp?: string;
  data?: T;
}

/**
 * Full Server Envelope sent across gRPC to backend CBS.
 * Enriched by the Next.js proxy route with session credentials.
 */
export interface GrpcEnvelope {
  servicePath: string;
  requestType: string;
  controlName?: string;
  branchCode: string;
  recordFunction: string;
  recordId: string;
  authLevel: number;
  userId: string;
  clientId: string;
  data: Record<string, unknown>;
}
