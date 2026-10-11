/**
 * Universal API Transport Contracts for CBS Core Banking
 */

export const API_STATUSES = ["SUCCESS", "FAIL", "ERROR", "RECORD_NOT_FOUND"] as const;
export type ApiStatus = (typeof API_STATUSES)[number];

export interface ApiResponse<T = unknown> {
  readonly data?: T;
  readonly errors?: readonly string[];
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
  readonly idempotencyKey?: string;
  readonly message?: string;
  readonly status: ApiStatus | (string & {});
  readonly statusCode: number;
  readonly timestamp: string;
}

export const DEFAULT_SERVICE_PATH = "default" as const;

/**
 * Universal browser-to-proxy wire payload for CBS operations.
 *
 * Next.js proxy route (`/api/proxy`) receives this envelope and enriches it
 * with session identity (branchCode, userId, clientId) before gRPC forwarding.
 */
export interface CbsWirePayload<TData = Record<string, unknown>> {
  readonly authLevel?: number;
  readonly controlName?: string;
  readonly data?: TData;
  readonly recordFunction?: string;
  readonly recordId?: string;
  readonly requestType: string;
  readonly servicePath?: string;
}

/**
 * Full Server Envelope sent across gRPC to backend CBS.
 * Enriched by the Next.js proxy route with session credentials.
 */
export interface GrpcEnvelope {
  readonly authLevel: number;
  readonly branchCode: string;
  readonly clientId: string;
  readonly controlName?: string;
  readonly data: Readonly<Record<string, unknown>>;
  readonly recordFunction: string;
  readonly recordId: string;
  readonly requestType: string;
  readonly servicePath: string;
  readonly userId: string;
}
