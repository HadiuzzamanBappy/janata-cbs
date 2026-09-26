import "server-only";
import { STATIC_SPECS } from "@fixtures";
import { type FormSchema, parseGMC } from "@/features/engine";
import { env } from "@/lib/config/env";
import { getOrSet } from "@/lib/core/cache";
import { getServiceUrl } from "@/lib/core/services";
import { grpcProcess } from "@/lib/grpc";

const SPEC_TTL_SECONDS = env.SPEC_TTL_SECONDS || 3600;

async function fetchSchemaFromBackend(
  command: string,
  token?: string,
): Promise<FormSchema | null> {
  const cleanCmd = command.split(",")[0].trim().toUpperCase();

  if (env.MODEL_SOURCE === "static") {
    const rawMock = STATIC_SPECS[cleanCmd];
    if (!rawMock) return null;
    const parsed = parseGMC(rawMock, cleanCmd);
    return parsed.success ? parsed.data : null;
  }

  try {
    const targetServiceKey =
      process.env.NODE_ENV === "development" ? "defaultdev" : "default";
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
        branchCode: env.NEXT_PUBLIC_CENTRAL_BRANCH || "JB9999",
        authLevel: 1,
        userId: "SYSUSER",
        data: {},
      },
      { token },
    );

    if (res.statusCode !== 200 || !res.data) {
      const rawMock = STATIC_SPECS[cleanCmd];
      if (!rawMock) return null;
      const parsed = parseGMC(rawMock, cleanCmd);
      return parsed.success ? parsed.data : null;
    }

    const parsed = parseGMC(res.data, cleanCmd);
    if (parsed.success) return parsed.data;

    const rawMock = STATIC_SPECS[cleanCmd];
    if (!rawMock) return null;
    const fallbackParsed = parseGMC(rawMock, cleanCmd);
    return fallbackParsed.success ? fallbackParsed.data : null;
  } catch (err) {
    console.warn(
      `[model-fetcher] gRPC GMC fetch failed for ${cleanCmd}, falling back to static mock:`,
      err,
    );
    const rawMock = STATIC_SPECS[cleanCmd];
    if (!rawMock) return null;
    const parsed = parseGMC(rawMock, cleanCmd);
    return parsed.success ? parsed.data : null;
  }
}

/**
 * Server Component / RSC model specification fetcher with read-through Redis cache.
 */
export async function getModelData(
  command: string,
  token?: string,
): Promise<FormSchema | null> {
  const cleanCommand = command.toUpperCase();
  const cacheKey = `spec:${cleanCommand}`;
  return getOrSet(
    cacheKey,
    () => fetchSchemaFromBackend(cleanCommand, token),
    SPEC_TTL_SECONDS,
  );
}
