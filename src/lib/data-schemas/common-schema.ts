import { z } from "zod";
import { CBS_RECORD_STATUSES, isCbsMutationRequest } from "@/types";

/* -------------------------------------------------------------------------- */
/* 1. Protocol & Banking Enums (Zero Fallbacks, Strict Whitelist)             */
/* -------------------------------------------------------------------------- */

/** Canonical BFF/core response statuses. The single source for every status comparison. */
export const CBS_API_STATUS = {
  SUCCESS: "SUCCESS",
  FAIL: "FAIL",
  ERROR: "ERROR",
  RECORD_NOT_FOUND: "RECORD_NOT_FOUND",
  RETRY: "RETRY",
} as const;
export type ApiStatus = (typeof CBS_API_STATUS)[keyof typeof CBS_API_STATUS];
export const apiStatusSchema = z.enum(CBS_API_STATUS);

/** The one success predicate for any API response envelope. */
export function isApiSuccess(response: { readonly status: string }): boolean {
  return response.status === CBS_API_STATUS.SUCCESS;
}

const cbsRecordStatusSchema = z.enum(CBS_RECORD_STATUSES);

/* -------------------------------------------------------------------------- */
/* 2. Maker-Checker Audit Trail Contract                                      */
/* -------------------------------------------------------------------------- */

/**
 * Audit trail directly from DB ledger.
 * Resilient: Safely extracts standard audit stamps even if DB carries extra attributes.
 */
export const auditDataSchema = z.object({
  recStatus: z.union([cbsRecordStatusSchema, z.literal("")]).optional(),
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

const enforceMutationIdempotency = (
  val: { requestType: string; idempotencyKey?: string },
  ctx: z.RefinementCtx,
) => {
  if (isCbsMutationRequest(val.requestType) && !val.idempotencyKey) {
    ctx.addIssue({
      code: "custom",
      path: ["idempotencyKey"],
      message: "UUIDv4 idempotencyKey is required for mutation requests",
    });
  }
};

export const cbsWirePayloadSchema = z
  .object({
    idempotencyKey: z.uuid("Idempotency key must be a valid UUID").optional(),
    requestType: z.string().min(1, "Request type is required"),
    controlName: z.string().optional(),
    recordFunction: z.string().optional(),
    recordId: z.string().optional(),
    branchCode: z.string().optional(),
    authLevel: z.number().int().min(0).max(9).optional(),
    servicePath: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .superRefine(enforceMutationIdempotency);

export type CbsWirePayload = z.infer<typeof cbsWirePayloadSchema>;

/* -------------------------------------------------------------------------- */
/* 5. Server Envelope Contract (BFF Proxy -> gRPC / Core Dispatcher)          */
/* -------------------------------------------------------------------------- */

const grpcEnvelopeSchema = z
  .object({
    idempotencyKey: z.uuid("Idempotency key must be a valid UUID").optional(),
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
  })
  .superRefine(enforceMutationIdempotency);
export type GrpcEnvelope = z.infer<typeof grpcEnvelopeSchema>;

/* -------------------------------------------------------------------------- */
/* 6. Universal Core -> BFF -> Client API Response Envelope                  */
/* -------------------------------------------------------------------------- */

export const apiResponseSchema = z.object({
  status: apiStatusSchema,
  statusCode: z.number().int(),
  idempotencyKey: z.string().optional(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  errors: z.array(z.string()).readonly().optional(),
  fieldErrors: z.record(z.string(), z.array(z.string()).readonly()).readonly().optional(),
  timestamp: z.string(),
});

type InferredApiResponse = z.infer<typeof apiResponseSchema>;

export type ApiResponse<T = unknown> = Omit<InferredApiResponse, "data"> & {
  readonly data?: T;
};
