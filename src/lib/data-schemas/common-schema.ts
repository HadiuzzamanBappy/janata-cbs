import { z } from "zod";
import { CBS_RECORD_STATUSES, type CbsRecordLifecycleStatus } from "@/types";

/* -------------------------------------------------------------------------- */
/* 1. Protocol & Banking Enums (Zero Fallbacks, Strict Whitelist)             */
/* -------------------------------------------------------------------------- */

export const API_STATUSES = ["SUCCESS", "FAIL", "ERROR", "RECORD_NOT_FOUND", "RETRY"] as const;
export type ApiStatus = (typeof API_STATUSES)[number];

export const cbsRecordStatusSchema = z.enum(CBS_RECORD_STATUSES);
export type CbsRecordStatusCode = CbsRecordLifecycleStatus;

/* -------------------------------------------------------------------------- */
/* 2. Maker-Checker Audit Trail Contract                                      */
/* -------------------------------------------------------------------------- */

/**
 * Audit trail directly from DB ledger.
 * Resilient: Safely extracts standard audit stamps even if DB carries extra attributes.
 */
export const auditDataSchema = z.object({
  recStatus: cbsRecordStatusSchema.optional(),
  recCurrNumber: z.number().int().nonnegative().optional(),
  recInputter: z.string().optional(),
  recInputTime: z.string().optional(),
  recAuthorizer: z.string().optional(),
  recAuthTime: z.string().optional(),
  recBranchCode: z.string().optional(),
});

export type AuditData = z.infer<typeof auditDataSchema>;

/* -------------------------------------------------------------------------- */
/* 3. Client -> BFF Wire Request (Zero Tolerance: STRICT)                     */
/* -------------------------------------------------------------------------- */

export const cbsWirePayloadSchema = z
  .object({
    idempotencyKey: z.string().optional(),
    requestType: z.string().min(1, "Request type is required"),
    controlName: z.string().optional(),
    recordFunction: z.string().optional(),
    recordId: z.string().optional(),
    branchCode: z.string().optional(),
    authLevel: z.number().int().min(0).max(9).optional(),
    servicePath: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type CbsWirePayload = z.infer<typeof cbsWirePayloadSchema>;

/* -------------------------------------------------------------------------- */
/* 5. Server Envelope Contract (BFF Proxy -> gRPC / Core Dispatcher)          */
/* -------------------------------------------------------------------------- */

export const grpcEnvelopeSchema = z.object({
  idempotencyKey: z.string().optional(),
  clientId: z.string().min(1),
  requestType: z.string().min(1),
  controlName: z.string().default(""),
  recordFunction: z.string().default(""),
  recordId: z.string().default(""),
  branchCode: z.string().min(1),
  authLevel: z.number().int().min(0).max(9),
  userId: z.string().min(1),
  servicePath: z.string().default("default"),
  data: z.record(z.string(), z.unknown()).default({}),
});
export type GrpcEnvelope = z.infer<typeof grpcEnvelopeSchema>;

/* -------------------------------------------------------------------------- */
/* 6. Universal Core -> BFF -> Client API Response Envelope                  */
/* -------------------------------------------------------------------------- */

export const apiResponseSchema = z.object({
  status: z.enum(API_STATUSES).or(z.string()),
  statusCode: z.number().int(),
  idempotencyKey: z.string().optional(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  errors: z.array(z.string()).readonly().optional(),
  fieldErrors: z.record(z.string(), z.array(z.string()).readonly()).readonly().optional(),
  timestamp: z.string(),
  success: z.boolean().optional(),
});

type InferredApiResponse = z.infer<typeof apiResponseSchema>;

export type ApiResponse<T = unknown> = Omit<InferredApiResponse, "data"> & {
  readonly data?: T;
};
