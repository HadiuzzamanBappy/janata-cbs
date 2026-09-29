import "server-only";
import { STATIC_SPECS } from "@fixtures";
import { type FormSchema, parseGMC } from "@/features/screens";
import { env } from "@/lib/config/env";
import { getOrSet } from "@/lib/core/cache";
import { getSession } from "@/lib/core/redis-session";
import { getServiceUrl } from "@/lib/core/services";
import { grpcProcess } from "@/lib/grpc";

const SPEC_TTL_SECONDS = env.SPEC_TTL_SECONDS || 3600;

async function fetchSchemaFromBackend(
  command: string,
  tokenParam?: string,
): Promise<FormSchema | null> {
  const cleanCmd = command.split(",")[0].trim().toUpperCase();

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

  const targetServiceKey = process.env.NODE_ENV === "development" ? "defaultdev" : "default";
  const address = getServiceUrl(targetServiceKey);

  const res = await grpcProcess(
    address,
    "nonfinancial",
    {
      idempotencyKey: "",
      clientId: "WEB-CLIENT",
      requestType: env.MODEL_REQUEST_TYPE || "GMC",
      controlName: "?",
      recordFunction: "S",
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

/**
 * Server Component / RSC model specification fetcher with read-through Redis cache.
 */
export async function getModelData(command: string, token?: string): Promise<FormSchema | null> {
  const cleanCommand = command.toUpperCase();
  const cacheKey = `spec:${cleanCommand}`;
  return getOrSet(cacheKey, () => fetchSchemaFromBackend(cleanCommand, token), SPEC_TTL_SECONDS);
}
