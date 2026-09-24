import "server-only";
import { type BranchMock, STATIC_BRANCHES } from "@fixtures";
import { env } from "@/lib/config/env";
import { grpcProcess } from "@/lib/grpc";
import { getServiceUrl } from "@/lib/core/services";

import { getSession } from "@/lib/core/redis-session";

export async function getBranches(tokenParam?: string): Promise<BranchMock[]> {
  if (env.MODEL_SOURCE === "static") {
    return STATIC_BRANCHES;
  }

  try {
    // 1. Obtain session token and active user context
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

    // 2. Dispatch gRPC call with exact requestType: "GRL"
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

      // 3. Unpack gRPC Struct / Protobuf fields format if present
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

      return formattedBranches;
    }

    throw new Error(
      res.message || `gRPC server returned status code ${res.statusCode}`,
    );
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("[branches] gRPC branch fetch failed:", error);
    throw new Error(
      error?.message || "Failed to fetch branch list from gRPC service",
    );
  }
}
