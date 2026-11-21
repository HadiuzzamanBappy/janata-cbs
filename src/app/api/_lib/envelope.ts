import { serverConfig } from "@/lib/core-config/server";
import { type CbsWirePayload, DEFAULT_SERVICE, type GrpcEnvelope } from "@/lib/data-schemas";
import type { SessionData } from "@/lib/infra-redis";

type EnvelopeRequest = Pick<CbsWirePayload, "requestType"> & Partial<CbsWirePayload>;

/**
 * Builds the core gRPC envelope for a BFF route. Branch, user and client identity always come
 * from the server session and config, never from the browser.
 */
export function buildGrpcEnvelope(session: SessionData, body: EnvelopeRequest): GrpcEnvelope {
  return {
    servicePath: body.servicePath || DEFAULT_SERVICE,
    requestType: body.requestType,
    controlName: body.controlName ?? "",
    branchCode: session.currUser.branchCode || serverConfig.centralBranch,
    recordFunction: body.recordFunction ?? "",
    recordId: body.recordId ?? "",
    authLevel: body.authLevel ?? 1,
    idempotencyKey: body.idempotencyKey,
    userId: session.userId,
    clientId: serverConfig.grpc.clientId,
    data: body.data ?? {},
  };
}
