import { type NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/core-config/server";
import { decodeProtobufValue, parseInquiryRecords } from "@/lib/data-parsers";
import { dispatch } from "@/lib/infra-grpc/dispatch";
import { getSession } from "@/lib/infra-redis";
import { getStaticProxyResponse } from "@/lib/infra-services/static-provider";
import type { GrpcEnvelope } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProxyBody {
  requestType?: string;
  servicePath?: string;
  controlName?: string;
  recordFunction?: string;
  recordId?: string;
  authLevel?: number;
  data?: Record<string, unknown>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
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
    const body = (await req.json()) as ProxyBody;

    if (!body.requestType) {
      return NextResponse.json(
        {
          status: "FAIL",
          statusCode: 400,
          message: "Request type is missing in proxy payload",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    // =========================================================================
    // 1. STATIC MODE: Return fixtures via unified static provider
    // =========================================================================
    if (appConfig.modelSource === "static") {
      const staticRes = getStaticProxyResponse(body.requestType, body.controlName, body.recordId);
      return NextResponse.json(staticRes, { status: staticRes.statusCode });
    }

    // =========================================================================
    // 2. gRPC MODE: Dispatch to Core CBS Host (with graceful offline fallback)
    // =========================================================================
    const servicePath = body.servicePath || "default";

    const envelope: GrpcEnvelope = {
      servicePath,
      requestType: body.requestType,
      controlName: body.controlName ?? "",
      branchCode: currUser.branchCode,
      recordFunction: body.recordFunction || "S",
      recordId: body.recordId || "",
      authLevel: body.authLevel ?? 1,
      userId,
      clientId: appConfig.grpc.clientId,
      data: body.data ?? {},
    };

    try {
      const response = await dispatch(envelope, token);
      if (response && response.status === "SUCCESS") {
        if (body.requestType === "INQ" && response.data) {
          const parsedRows = parseInquiryRecords(response);
          return NextResponse.json(
            {
              ...response,
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
            data: cleanData,
          },
          { status: 200 },
        );
      }

      return NextResponse.json(
        response || {
          status: "RECORD_NOT_FOUND",
          statusCode: 404,
          message: `Record #${body.recordId || ""} not found on CBS host.`,
          data: null,
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      );
    } catch (dispatchErr: unknown) {
      const errMsg =
        dispatchErr instanceof Error ? dispatchErr.message : "CBS Host communication failed";
      return NextResponse.json(
        {
          status: "ERROR",
          statusCode: 502,
          message: errMsg,
          data: null,
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Proxy Dispatch Error";
    return NextResponse.json(
      {
        status: "ERROR",
        statusCode: 200,
        message,
        data: null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
