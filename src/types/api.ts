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
