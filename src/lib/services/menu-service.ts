import "server-only";
import { STATIC_MENU } from "@fixtures";
import { type MenuItem, parseMNU } from "@/features/screens";
import { appConfig } from "@/lib/config";
import { getServiceUrl } from "@/lib/core/services";
import { grpcProcess } from "@/lib/grpc";
import { getOrSet, getSession } from "@/lib/redis";

/* ---------- Domain & Cache Constants ---------- */
const MENU_TTL_SECONDS = appConfig.redis.menuTtlSeconds;
const MENU_REQUEST_TYPE = "GUM";
const DEFAULT_MENU_CONTROL = "MAIN_MENU";
const MENU_RECORD_FUNCTION = "L";

/* ---------- Backend RPC Fetcher ---------- */
async function fetchMenuFromBackend(
  controlName: string = DEFAULT_MENU_CONTROL,
  tokenParam?: string,
): Promise<MenuItem[]> {
  // Static mock fallback
  if (appConfig.modelSource === "static") {
    const parseResult = parseMNU(STATIC_MENU);
    if (!parseResult.success) {
      throw new Error(`Failed to parse static menu: ${parseResult.error}`);
    }
    return parseResult.data;
  }

  // gRPC environment mode (Strict execution, no fallbacks)
  const session = await getSession();
  const token = tokenParam || session?.token;
  if (!token) {
    throw new Error("UNAUTHENTICATED: No valid session token available for gRPC menu fetch");
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
      requestType: MENU_REQUEST_TYPE,
      controlName,
      recordFunction: MENU_RECORD_FUNCTION,
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
      `gRPC menu fetch failed with status code ${res.statusCode}: ${res.message || "No data returned"}`,
    );
  }

  const parsed = parseMNU(res.data);
  if (!parsed.success) {
    throw new Error(`gRPC menu schema parsing failed: ${parsed.error}`);
  }

  return parsed.data;
}

/* ---------- Exported Cached Readers ---------- */
export async function getMenuData(
  token?: string,
  controlName: string = DEFAULT_MENU_CONTROL,
): Promise<MenuItem[]> {
  const cacheKey = `menu:${controlName}`;
  return getOrSet(cacheKey, () => fetchMenuFromBackend(controlName, token), MENU_TTL_SECONDS);
}
