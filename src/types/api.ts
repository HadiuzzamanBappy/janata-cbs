/**
 * Universal API Transport Contracts for CBS Core Banking
 */

export const API_STATUSES = ["SUCCESS", "FAIL", "ERROR", "RECORD_NOT_FOUND"] as const;
export type ApiStatus = (typeof API_STATUSES)[number];

export interface ApiResponse<T = unknown> {
  readonly success?: boolean;
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

export type { CbsWirePayload } from "@/lib/data-schemas/common-schema";

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
  readonly idempotencyKey?: string;
  readonly recordFunction: string;
  readonly recordId: string;
  readonly requestType: string;
  readonly servicePath: string;
  readonly userId: string;
}
