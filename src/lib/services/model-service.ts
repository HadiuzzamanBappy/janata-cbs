import "server-only";
import { STATIC_SPECS } from "@fixtures";
import { type FormSchema, parseGMC } from "@/features/screens";
import { env } from "@/lib/config/env";
import { getServiceUrl } from "@/lib/core/services";
import { grpcProcess } from "@/lib/grpc";
import { getOrSet, getSession } from "@/lib/redis";

/* ---------- Domain & Cache Constants ---------- */
const SPEC_TTL_SECONDS = env.SPEC_TTL_SECONDS || 3600;
const MODEL_REQUEST_TYPE = "GMC";
const MODEL_CONTROL_NAME = "?";
const MODEL_RECORD_FUNCTION = "S";

/* ---------- Backend RPC Fetcher ---------- */
async function fetchSchemaFromBackend(
  command: string,
  tokenParam?: string,
): Promise<FormSchema | null> {
  const cleanCmd = command.split(",")[0].trim().toUpperCase();

  // Static mock fallback
  if (env.MODEL_SOURCE === "static") {
    const rawMock = STATIC_SPECS[cleanCmd];
    if (!rawMock) return null;
    const parsed = parseGMC(rawMock, cleanCmd);
    return parsed.success ? parsed.data : null;
  }

  // gRPC environment mode (Strict execution, no fallbacks)
  const session = await getSession();
  const token = tokenParam || session?.token;
  const userId = session?.userId || session?.currUser?.userId || "SYSUSER";
  const branchCode = session?.currUser?.branchCode || env.NEXT_PUBLIC_CENTRAL_BRANCH || "JB9999";

  const address = getServiceUrl("default");

  const res = await grpcProcess(
    address,
    "nonfinancial",
    {
      idempotencyKey: "",
      clientId: "WEB-CLIENT",
      requestType: MODEL_REQUEST_TYPE,
      controlName: MODEL_CONTROL_NAME,
      recordFunction: MODEL_RECORD_FUNCTION,
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
      `gRPC GMC fetch failed for ${cleanCmd} with status code ${res.statusCode}: ${res.message || "No data returned"}`,
    );
  }

  const parsed = parseGMC(res.data, cleanCmd);
  if (!parsed.success) {
    throw new Error(`gRPC GMC schema parsing failed for ${cleanCmd}: ${parsed.error}`);
  }

  return parsed.data;
}

/* ---------- Exported Cached Readers ---------- */
export async function getModelData(command: string, token?: string): Promise<FormSchema | null> {
  const cleanCommand = command.toUpperCase();
  const cacheKey = `spec:${cleanCommand}`;
  return getOrSet(cacheKey, () => fetchSchemaFromBackend(cleanCommand, token), SPEC_TTL_SECONDS);
}
