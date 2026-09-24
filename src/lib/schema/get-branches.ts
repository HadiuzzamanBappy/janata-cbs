import "server-only";
import { type BranchMock, STATIC_BRANCHES } from "@fixtures";
import { env } from "@/lib/config/env";
import { grpcProcess } from "@/lib/grpc";
import { getServiceUrl } from "@/lib/core/services";

import { getSession } from "@/lib/core/redis-session";

import { getOrSet } from "@/lib/core/cache";

const BRANCH_TTL_SECONDS = 3600; // 1 hour cache

async function fetchBranchesFromBackend(tokenParam?: string): Promise<BranchMock[]> {
  if (env.MODEL_SOURCE === "static") {
    return STATIC_BRANCHES;
  }

  try {
    const session = await getSession();
    const token = tokenParam || session?.token;
    const userId = session?.userId || session?.currUser?.userId || "SYSUSER";
    const branchCode =
      session?.currUser?.branchCode ||
      env.NEXT_PUBLIC_CENTRAL_BRANCH ||
      "JB9999";

    const targetServiceKey =
      process.env.NODE_ENV === "development" ? "defaultdev" : "default";
    const address = getServiceUrl(targetServiceKey);

    const res = await grpcProcess(
      address,
      "nonfinancial",
      {
        idempotencyKey: "",
        clientId: "WEB-CLIENT",
        requestType: "GRL",
        controlName: "BRANCH",
        recordFunction: "L",
        recordId: "",
        branchCode,
        authLevel: 1,
        userId,
        data: {},
      },
      { token },
    );

    if (res.statusCode === 200 && res.data) {
      let rawItems: unknown[] = [];

      if (Array.isArray(res.data)) {
        rawItems = res.data;
      } else if (typeof res.data === "object" && res.data !== null) {
        const obj = res.data as Record<string, unknown>;
        if (Array.isArray(obj.items)) rawItems = obj.items;
        else if (Array.isArray(obj.data)) rawItems = obj.data;
        else if (Array.isArray(obj.branches)) rawItems = obj.branches;
        else if (Array.isArray(obj.records)) rawItems = obj.records;
        else if (Array.isArray(obj.list)) rawItems = obj.list;
        else rawItems = [obj];
      }

      const formattedBranches = rawItems.map((item: any) => {
        const fields = item?.struct_value?.fields || item?.fields || item;
        const getString = (key: string) =>
          fields?.[key]?.string_value ?? fields?.[key] ?? "";

        return {
          recordId: getString("recordId"),
          branchTitle: getString("branchTitle").trim(),
          branchAddress: getString("branchAddress") || getString("address") || "",
          branchOpenDate: getString("branchOpenDate") || getString("openDate") || "",
          currTxnDate: getString("currTxnDate") || getString("txnDate") || "",
          divCode: getString("divCode"),
          areaCode: getString("areaCode"),
        } as BranchMock;
      });

      if (formattedBranches.length > 0) {
        return formattedBranches;
      }
    }

    return STATIC_BRANCHES;
  } catch (err: unknown) {
    console.warn(
      "[branches] gRPC branch fetch failed, using static fallback:",
      err,
    );
    return STATIC_BRANCHES;
  }
}

export async function getBranches(tokenParam?: string): Promise<BranchMock[]> {
  const cacheKey = "branches:list";
  return getOrSet(
    cacheKey,
    () => fetchBranchesFromBackend(tokenParam),
    BRANCH_TTL_SECONDS,
  );
}
