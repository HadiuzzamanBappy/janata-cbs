import { type NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { dispatch, type Envelope } from "@/lib/grpc/dispatch";
import { getSession } from "@/lib/redis";
import { STATIC_TABLE_DATA } from "@fixtures";

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

    const servicePath = body.servicePath || "default";

    const envelope: Envelope = {
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

    // If modelSource is static, return offline fixtures immediately without waiting for gRPC timeout
    const cleanModel = (body.controlName || "").trim().toUpperCase();
    const modelTable = STATIC_TABLE_DATA[cleanModel];

    if (appConfig.modelSource === "static" && modelTable) {
      if (body.recordId && modelTable.records?.[body.recordId.trim()]) {
        return NextResponse.json({
          status: "SUCCESS",
          statusCode: 200,
          message: "Record loaded from offline fixture",
          data: modelTable.records[body.recordId.trim()],
          timestamp: new Date().toISOString(),
        });
      }

      if (modelTable.enquiryRows && modelTable.enquiryRows.length > 0) {
        return NextResponse.json({
          status: "SUCCESS",
          statusCode: 200,
          message: "Enquiry data loaded from offline fixture",
          data: modelTable.enquiryRows,
          timestamp: new Date().toISOString(),
        });
      }
    }

    try {
      const response = await dispatch(envelope, token);
      if (response && response.status === "SUCCESS") {
        return NextResponse.json(response, { status: 200 });
      }
      // If dispatch failed or returned an error, attempt fixture fallback below
    } catch {
      // Backend not running / gRPC offline
    }

    // Graceful Fallback: Check local STATIC_TABLE_DATA fixture
    if (modelTable) {
      if (body.recordId && modelTable.records?.[body.recordId.trim()]) {
        return NextResponse.json({
          status: "SUCCESS",
          statusCode: 200,
          message: "Record loaded from offline fixture",
          data: modelTable.records[body.recordId.trim()],
          timestamp: new Date().toISOString(),
        });
      }

      if (modelTable.enquiryRows && modelTable.enquiryRows.length > 0) {
        return NextResponse.json({
          status: "SUCCESS",
          statusCode: 200,
          message: "Enquiry data loaded from offline fixture",
          data: modelTable.enquiryRows,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(
      {
        status: "RECORD_NOT_FOUND",
        statusCode: 200,
        message: `Record #${body.recordId || ""} not found.`,
        data: null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
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
