/**
 * Universal API Transport Contracts for CBS Core Banking
 */

export interface APIResponse<T = unknown> {
  status: string;
  statusCode: number;
  idempotencyKey?: string;
  message: string;
  errors?: string[];
  timestamp?: string;
  data?: T;
}

export type ApiResponse<T = unknown> = APIResponse<T>;

export interface Envelope {
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

export type CbsEnvelope = Envelope;
