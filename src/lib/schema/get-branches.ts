import "server-only";
import { type BranchMock, STATIC_BRANCHES } from "@fixtures";
import { env } from "@/lib/config/env";
import { grpcProcess } from "@/lib/core/grpc";
import { getServiceUrl } from "@/lib/core/services";

export async function getBranches(token?: string): Promise<BranchMock[]> {
  if (env.MODEL_SOURCE === "static") {
    return STATIC_BRANCHES;
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
        requestType: "BRN",
        controlName: "BRANCH_LIST",
        recordFunction: "L",
        recordId: "",
        branchCode: env.NEXT_PUBLIC_CENTRAL_BRANCH || "JB9999",
        authLevel: 1,
        userId: "SYSUSER",
        data: {},
      },
      { token },
    );

    if (res.statusCode === 200 && Array.isArray(res.data)) {
      return res.data;
    }

    return STATIC_BRANCHES;
  } catch (err) {
    console.warn(
      "[branches] gRPC branch fetch failed, falling back to static branches:",
      err,
    );
    return STATIC_BRANCHES;
  }
}
