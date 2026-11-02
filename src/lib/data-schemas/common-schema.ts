import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Standard CBS Constants & Audit Trail Contract                             */
/* -------------------------------------------------------------------------- */

export const API_STATUSES = ["SUCCESS", "FAIL", "ERROR", "RECORD_NOT_FOUND"] as const;
export type ApiStatus = (typeof API_STATUSES)[number];

/**
 * Standard CBS Maker-Checker Audit Trail Contract.
 * Tracks lifecycle status ("AU" Live, "INA" Pending, "HLD" Held, "DEL" Deleted)
 * and dual-control operator stamps across all maintainable records.
 */
export const auditDataSchema = z.object({
  recStatus: z.string().optional(),
  recCurrNumber: z.number().optional(),
  recInputter: z.string().optional(),
  recInputTime: z.string().optional(),
  recAuthorizer: z.string().optional(),
  recAuthTime: z.string().optional(),
  recBranchCode: z.string().optional(),
});

export type AuditData = z.infer<typeof auditDataSchema>;

/* -------------------------------------------------------------------------- */
/* Universal Wire Payload Validation Schema (Client -> BFF Proxy)             */
/* -------------------------------------------------------------------------- */

/**
 * Zod schema validating wire payloads dispatched to `/api/proxy`.
 * Maps directly to GrpcRequest fields sent from browser client.
 */
export const cbsWirePayloadSchema = z.object({
  idempotencyKey: z.string().optional(),
  requestType: z.string().min(1, "Request type is required"),
  controlName: z.string().optional(),
  recordFunction: z.string().optional(),
  recordId: z.string().optional(),
  branchCode: z.string().optional(),
  authLevel: z.number().int().min(0).max(9).optional(),
  servicePath: z.string().default("default").optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type CbsWirePayload = z.infer<typeof cbsWirePayloadSchema>;

/* -------------------------------------------------------------------------- */
/* Full Server Envelope Contract (BFF Proxy -> gRPC / Mock Dispatcher)        */
/* -------------------------------------------------------------------------- */

/**
 * Zod schema validating the enriched server envelope dispatched to Core CBS.
 * Exactly matches `proto/service.proto` GrpcRequest fields.
 */
export const grpcEnvelopeSchema = z.object({
  idempotencyKey: z.string().optional(),
  clientId: z.string(),
  requestType: z.string(),
  controlName: z.string().optional(),
  recordFunction: z.string(),
  recordId: z.string(),
  branchCode: z.string(),
  authLevel: z.number().int(),
  userId: z.string(),
  servicePath: z.string().default("default"),
  data: z.record(z.string(), z.unknown()),
});

export type GrpcEnvelope = z.infer<typeof grpcEnvelopeSchema>;

/* -------------------------------------------------------------------------- */
/* Universal Response Schema & Inferred Type (Core -> BFF -> Client)         */
/* -------------------------------------------------------------------------- */

/**
 * Canonical Zod schema validating API response contracts.
 * Matches `proto/service.proto` GrpcResponse specification.
 */
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

/**
 * Canonical typed API response envelope for CBS application layers.
 * 100% derived from `apiResponseSchema` with generic `<T>` support for `data`.
 */
export type ApiResponse<T = unknown> = Omit<InferredApiResponse, "data"> & {
  readonly data?: T;
};
