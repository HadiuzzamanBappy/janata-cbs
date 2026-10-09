import "server-only";
import { STATIC_INQUIRIES } from "@fixtures";
import { appConfig, getServiceUrl } from "@/lib/config/server";
import { grpcProcess } from "@/lib/grpc";
import { parseEnquiry } from "@/lib/parsers";
import { getOrSet, getSession } from "@/lib/redis";
import type { EnquirySchema } from "@/lib/schemas";

const SPEC_TTL_SECONDS = appConfig.redis.specTtlSeconds;
const ENQUIRY_REQUEST_TYPE = "GET";
const ENQUIRY_CONTROL_NAME = "INQUIRY";
const ENQUIRY_RECORD_FUNCTION = "S";

async function fetchEnquiryWirePayload(command: string, tokenParam?: string): Promise<unknown> {
  const cleanCmd = command
    .split(",")[0]
    .trim()
    .toUpperCase()
    .replace(/^(?:INQ\s+|INQUIRY\s+)/i, "")
    .replace(/^(?:[SRIDAH]\s+)/i, "")
    .trim();

  if (appConfig.modelSource === "static") {
    return STATIC_INQUIRIES[cleanCmd]?.data ?? null;
  }

  const session = await getSession();
  const token = tokenParam || session?.token;
  if (!token) {
    throw new Error(
      `UNAUTHENTICATED: No valid session token available for gRPC enquiry schema fetch (${cleanCmd})`,
    );
  }

  const userId = session?.userId || session?.currUser?.userId || "SYSUSER";
  const branchCode = session?.currUser?.branchCode || appConfig.centralBranch;
  const address = getServiceUrl("default");

  const res = await grpcProcess(
    address,
    "nonfinancial",
    {
      idempotencyKey: "",
      clientId: appConfig.grpc.clientId,
      requestType: ENQUIRY_REQUEST_TYPE,
      controlName: ENQUIRY_CONTROL_NAME,
      recordFunction: ENQUIRY_RECORD_FUNCTION,
      recordId: cleanCmd,
      branchCode,
      authLevel: 1,
      userId,
      data: {},
    },
    { token },
  );

  if (res.statusCode !== 200 || !res.data) {
    throw new Error(
      `gRPC Enquiry fetch failed for ${cleanCmd} with status code ${res.statusCode}: ${res.message || "No data returned"}`,
    );
  }

  return res.data;
}

export async function getEnquiryData(
  command: string,
  token?: string,
): Promise<EnquirySchema | null> {
  const cleanCommand = command
    .split(",")[0]
    .trim()
    .toUpperCase()
    .replace(/^(?:INQ\s+|INQUIRY\s+)/i, "")
    .replace(/^(?:[SRIDAH]\s+)/i, "")
    .trim();

  const cacheKey = `spec:enq:${cleanCommand}`;

  return getOrSet(
    cacheKey,
    async () => {
      const wireData = await fetchEnquiryWirePayload(cleanCommand, token);
      if (!wireData) return null;
      const parseResult = parseEnquiry(wireData, cleanCommand);
      return parseResult.success ? parseResult.data : null;
    },
    SPEC_TTL_SECONDS,
  );
}
