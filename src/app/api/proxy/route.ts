import { type NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/core-config/server";
import { decodeProtobufValue, parseInquiryRecords } from "@/lib/data-parsers";
import { cbsWirePayloadSchema } from "@/lib/data-schemas";
import { dispatch } from "@/lib/infra-grpc/dispatch";
import { getSession } from "@/lib/infra-redis";
import { getMockProxyResponse } from "@/lib/infra-services/mock-service";
import { type ApiResponse, DEFAULT_SERVICE_PATH, type GrpcEnvelope } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();

    if (!session?.currUser) {
      return NextResponse.json(
        {
          status: "FAIL",
          statusCode: 401,
          message: "User session expired or unauthorized",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }

    const { token, userId, currUser } = session;
    const rawBody = await req.json();
    const parsed = cbsWirePayloadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          status: "FAIL",
          statusCode: 400,
          message: parsed.error.issues[0]?.message || "Invalid proxy request payload",
          errors: parsed.error.issues.map((i) => i.message),
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const body = parsed.data;

    // =========================================================================
    // 1. STATIC MODE: Return fixtures via unified static provider
    // =========================================================================
    if (appConfig.modelSource === "static") {
      const staticRes = getMockProxyResponse(body.requestType, body.controlName, body.recordId);
      return NextResponse.json(
        { ...staticRes, success: staticRes.status === "SUCCESS" },
        { status: staticRes.statusCode },
      );
    }

    // =========================================================================
    // 2. gRPC MODE: Dispatch to Core CBS Host (with graceful offline fallback)
    // =========================================================================
    // Resilient Hierarchical Branch Code Resolution:
    // 1. Explicit request override in wire payload
    // 2. Client-synced HTTP cookie (survives Redis restarts/offline)
    // 3. Authenticated session user branch from Redis/memory
    // 4. Canonical central branch fallback
    const cookieBranch = req.cookies.get(appConfig.auth.branchCookie)?.value;
    const resolvedBranchCode =
      parsed.data.branchCode || cookieBranch || currUser.branchCode || appConfig.centralBranch;

    const envelope: GrpcEnvelope = {
      servicePath: body.servicePath || DEFAULT_SERVICE_PATH,
      requestType: body.requestType,
      controlName: body.controlName ?? "",
      branchCode: resolvedBranchCode,
      recordFunction: body.recordFunction ?? "",
      recordId: body.recordId ?? "",
      authLevel: body.authLevel ?? 1,
      userId,
      clientId: appConfig.grpc.clientId,
      data: body.data ?? {},
    };

    try {
      const response = await dispatch(envelope, token);

      if (response.status === "SUCCESS") {
        if (body.requestType === "INQ" && response.data) {
          const parsedRows = parseInquiryRecords(response);
          return NextResponse.json(
            {
              ...response,
              success: true,
              data: parsedRows,
            },
            { status: 200 },
          );
        }
        // Normalize dynamic Protobuf struct values into clean plain JS objects
        const cleanData = response.data ? decodeProtobufValue(response.data) : response.data;
        return NextResponse.json(
          {
            ...response,
            success: true,
            data: cleanData,
          },
          { status: 200 },
        );
      }

      return NextResponse.json(
        {
          ...response,
          success: false,
        },
        {
          status: response.statusCode || 400,
        },
      );
    } catch (dispatchErr: unknown) {
      const errMsg =
        dispatchErr instanceof Error ? dispatchErr.message : "CBS Host communication failed";
      return NextResponse.json(
        {
          success: false,
          status: "ERROR",
          statusCode: 502,
          message: errMsg,
          data: null,
          timestamp: new Date().toISOString(),
        },
        { status: 502 },
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Proxy Dispatch Error";
    return NextResponse.json(
      {
        success: false,
        status: "ERROR",
        statusCode: 500,
        message,
        data: null,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
