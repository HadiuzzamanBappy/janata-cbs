import { z } from "zod";

/**
 * Validates outbound payload sent to /api/proxy
 */
export const cbsWirePayloadSchema = z.object({
  servicePath: z.string().default("default"),
  requestType: z.string().min(1, "requestType is required"),
  controlName: z.string().default(""),
  recordFunction: z.string().default("S"),
  recordId: z.string().default(""),
  authLevel: z.number().int().default(1),
  data: z.record(z.string(), z.unknown()).default({}),
});

export type CbsWirePayload<TData = Record<string, unknown>> = {
  servicePath?: string;
  requestType: string;
  controlName?: string;
  recordFunction?: string;
  recordId?: string;
  authLevel?: number;
  data?: TData;
};

/**
 * Universal CBS API Response
 */
export interface CbsApiResponse<T = unknown> {
  status: "SUCCESS" | "FAIL" | "ERROR";
  statusCode?: number;
  message?: string;
  errors?: string[];
  timestamp?: string;
  idempotencyKey?: string;
  data?: T;
}
