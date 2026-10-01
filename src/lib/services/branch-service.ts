import "server-only";
import { type BranchMock, STATIC_BRANCHES } from "@fixtures";
import { appConfig } from "@/lib/config";
import { getServiceUrl } from "@/lib/core/services";
import { extractStringField, getItemFields, grpcProcess, unwrapRecordsPayload } from "@/lib/grpc";
import { getOrSet, getSession } from "@/lib/redis";

/* ---------- Domain & Cache Constants ---------- */
const BRANCH_TTL_SECONDS = appConfig.redis.specTtlSeconds;
const BRANCH_REQUEST_TYPE = "GRL";
const BRANCH_CONTROL_NAME = "BRANCH";
const BRANCH_RECORD_FUNCTION = "L";

/* ---------- Backend RPC Fetcher ---------- */
async function fetchBranchesFromBackend(tokenParam?: string): Promise<BranchMock[]> {
  // Static mock fallback
  if (appConfig.modelSource === "static") {
    return STATIC_BRANCHES;
  }

  // gRPC environment mode (Strict execution, no fallbacks)
  const session = await getSession();
  const token = tokenParam || session?.token;
  if (!token) {
    throw new Error("UNAUTHENTICATED: No valid session token available for gRPC branch fetch");
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
      requestType: BRANCH_REQUEST_TYPE,
      controlName: BRANCH_CONTROL_NAME,
      recordFunction: BRANCH_RECORD_FUNCTION,
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
      `gRPC branch fetch failed with status code ${res.statusCode}: ${res.message || "No data returned"}`,
    );
  }

  const rawItems = unwrapRecordsPayload(res.data);

  return rawItems.map((item: unknown) => {
    const fields = getItemFields(item);
    return {
      recordId: extractStringField(fields, "recordId"),
      branchTitle: extractStringField(fields, "branchTitle").trim(),
      branchAddress:
        extractStringField(fields, "branchAddress") || extractStringField(fields, "address") || "",
      branchOpenDate:
        extractStringField(fields, "branchOpenDate") ||
        extractStringField(fields, "openDate") ||
        "",
      currTxnDate:
        extractStringField(fields, "currTxnDate") || extractStringField(fields, "txnDate") || "",
      divCode: extractStringField(fields, "divCode"),
      areaCode: extractStringField(fields, "areaCode"),
    } as BranchMock;
  });
}

/* ---------- Exported Cached Readers ---------- */
export async function getBranchesData(tokenParam?: string): Promise<BranchMock[]> {
  const cacheKey = "branches:list";
  return getOrSet(cacheKey, () => fetchBranchesFromBackend(tokenParam), BRANCH_TTL_SECONDS);
}
