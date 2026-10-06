import { STATIC_INQUIRIES, STATIC_INQUIRY_DATA, STATIC_TABLE_DATA } from "@fixtures";
import { type NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { dispatch, type GrpcEnvelope } from "@/lib/grpc/dispatch";
import { parseInquiryRecords } from "@/lib/parsers";
import { getSession } from "@/lib/redis";

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

    // If modelSource is static, return offline fixtures immediately without waiting for gRPC timeout
    const cleanModel = (body.controlName || "").trim().toUpperCase();
    const cleanRecordId = (body.recordId || "").trim().toUpperCase();

    // 1. INQ request handling (Inquiry datasets)
    if (body.requestType === "INQ") {
      if (appConfig.modelSource === "static") {
        // Dynamic Resolution:
        // 1. Check direct match by controlName or recordId in STATIC_INQUIRY_DATA
        let rawInquiry = STATIC_INQUIRY_DATA[cleanModel] || STATIC_INQUIRY_DATA[cleanRecordId];

        // 2. If not found directly, inspect STATIC_INQUIRIES schemas dynamically to find which inquiry matches this controllerName
        if (!rawInquiry && cleanModel) {
          for (const [inqKey, inqSpec] of Object.entries(STATIC_INQUIRIES)) {
            const fields = inqSpec.data?.fields as Record<string, unknown> | undefined;
            const inqInfo = fields?.INQInfo as
              | { struct_value?: { fields?: Record<string, { string_value?: string }> } }
              | undefined;
            const controller = inqInfo?.struct_value?.fields?.controllerName?.string_value
              ?.trim()
              .toUpperCase();

            if (controller === cleanModel && STATIC_INQUIRY_DATA[inqKey]) {
              rawInquiry = STATIC_INQUIRY_DATA[inqKey];
              break;
            }
          }
        }

        if (rawInquiry) {
          const records = parseInquiryRecords(rawInquiry);
          return NextResponse.json({
            status: "SUCCESS",
            statusCode: 200,
            message: "Inquiry data loaded from offline fixture",
            data: records,
            timestamp: new Date().toISOString(),
          });
        }

        // If no inquiry dataset fixture exists for this enquiry, return empty dataset
        return NextResponse.json({
          status: "SUCCESS",
          statusCode: 200,
          message: "No inquiry records found in fixture",
          data: [],
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 2. Standard Model Table handling (for Forms and non-INQ requests only)
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
