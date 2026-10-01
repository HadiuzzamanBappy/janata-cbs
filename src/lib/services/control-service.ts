import "server-only";
import { STATIC_COMMANDS } from "@fixtures";
import { appConfig } from "@/lib/config";
import type { SystemCommandItem } from "@/lib/core/commands";
import { getServiceUrl } from "@/lib/core/services";
import { extractStringField, getItemFields, grpcProcess, unwrapRecordsPayload } from "@/lib/grpc";
import { getOrSet, getSession } from "@/lib/redis";

/* ---------- Domain & Cache Constants ---------- */
const CONTROLS_TTL_SECONDS = appConfig.redis.menuTtlSeconds;
const CONTROL_REQUEST_TYPE = "GRL";
const CONTROL_CONTROL_NAME = "CONTROL";
const CONTROL_RECORD_FUNCTION = "L";

/* ---------- Data Payload Normalizer ---------- */
function parseControlsPayload(data: unknown): SystemCommandItem[] {
  const rawList = unwrapRecordsPayload(data);
  const result: SystemCommandItem[] = [];

  for (const item of rawList) {
    const fields = getItemFields(item);
    const cmdName =
      extractStringField(fields, "controlName") || extractStringField(fields, "recordId");
    const desc = extractStringField(fields, "description") || cmdName;

    if (cmdName) {
      result.push({
        id: cmdName,
        title: desc || cmdName,
        category: "System Controls & Commands",
        description: desc,
        command: cmdName,
        allowedRoles: ["*"],
        actionType: "SCREEN",
      });
    }
  }

  return result;
}

/* ---------- Backend RPC Fetcher ---------- */
async function fetchControlsFromBackend(tokenParam?: string): Promise<SystemCommandItem[]> {
  // Static mock fallback
  if (appConfig.modelSource === "static") {
    return parseControlsPayload(STATIC_COMMANDS.data);
  }

  // gRPC environment mode (Strict execution, no fallbacks)
  const session = await getSession();
  const token = tokenParam || session?.token;
  if (!token) {
    throw new Error("UNAUTHENTICATED: No valid session token available for gRPC controls fetch");
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
      requestType: CONTROL_REQUEST_TYPE,
      controlName: CONTROL_CONTROL_NAME,
      recordFunction: CONTROL_RECORD_FUNCTION,
      recordId: "",
      branchCode,
      authLevel: 1,
      userId,
      data: {},
    },
    { token },
  );

  if (res.statusCode !== 200 || !res.data) {
    throw new Error(
      `gRPC controls fetch failed with status code ${res.statusCode}: ${res.message || "No data returned"}`,
    );
  }

  return parseControlsPayload(res.data);
}

/* ---------- Exported Cached Readers ---------- */
export async function getControlsData(token?: string): Promise<SystemCommandItem[]> {
  const cacheKey = "controls:list";
  return getOrSet(cacheKey, () => fetchControlsFromBackend(token), CONTROLS_TTL_SECONDS);
}
