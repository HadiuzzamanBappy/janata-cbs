import { serverConfig } from "@/lib/core-config/server";
import { type CbsWirePayload, type GrpcEnvelope, INQUIRY_BRANCH_FIELD } from "@/lib/data-schemas";
import type { SessionData } from "@/lib/infra-redis";
import { CbsRequestType } from "@/types";

type EnvelopeRequest = Pick<CbsWirePayload, "requestType"> & Partial<CbsWirePayload>;

/**
 * Builds the core gRPC envelope for a BFF route. Branch, user and client identity always come
 * from the server session and config, never from the browser.
 */
export function buildGrpcEnvelope(session: SessionData, body: EnvelopeRequest): GrpcEnvelope {
  return {
    servicePath: body.servicePath ?? "default",
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

/**
 * Branch-wise inquiries filter on `INQUIRY_BRANCH_FIELD`. The browser builds that filter, so every
 * criterion on it (matched ignoring case) is forced to `EQ` the envelope's session branch: a
 * tampered value or operator (`NE`, `CT`) can't read another branch.
 */
export function pinInquiryBranch(envelope: GrpcEnvelope): GrpcEnvelope {
  const queryString = envelope.data.queryString;
  if (envelope.requestType !== CbsRequestType.INQ || !Array.isArray(queryString)) return envelope;
  const branchField = INQUIRY_BRANCH_FIELD.toLowerCase();
  const pinned = queryString.map((c) => {
    const name = (c as { selectFieldName?: unknown })?.selectFieldName;
    return typeof name === "string" && name.trim().toLowerCase() === branchField
      ? {
          ...(c as object),
          selectFieldName: INQUIRY_BRANCH_FIELD,
          selectFieldOperator: "EQ",
          selectFieldValue: envelope.branchCode,
        }
      : c;
  });
  return { ...envelope, data: { ...envelope.data, queryString: pinned } };
}
