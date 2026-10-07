import {
  STATIC_FORM_DATA,
  STATIC_INQUIRIES,
  STATIC_INQUIRY_DATA,
  STATIC_MODEL_CONFIGS,
} from "@fixtures";
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

    const cleanModel = (body.controlName || "").trim().toUpperCase();
    const cleanRecordId = (body.recordId || "").trim().toUpperCase();

    // =========================================================================
    // 1. STATIC MODE: Return fixtures immediately (DO NOT TOUCH gRPC AT ALL)
    // =========================================================================
    if (appConfig.modelSource === "static") {
      // A. Inquiry Requests (INQ)
      if (body.requestType === "INQ") {
        let rawInquiry = STATIC_INQUIRY_DATA[cleanModel] || STATIC_INQUIRY_DATA[cleanRecordId];

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

        return NextResponse.json({
          status: "SUCCESS",
          statusCode: 200,
          message: "No inquiry records found in fixture",
          data: [],
          timestamp: new Date().toISOString(),
        });
      }

      // B. Model Config / Data Dictionary Table Requests (MODEL.CONFIG / SC_MODEL_DEFINITION)
      if (cleanModel === "MODEL.CONFIG") {
        const targetId = (body.recordId || "").trim().toUpperCase();
        if (!targetId || targetId === "LIST" || targetId === "ALL") {
          const list = Object.values(STATIC_MODEL_CONFIGS).map((record) => ({
            id: record.recordId,
            label: `${record.description} (${record.tableName})`,
            details: `${record.properties.length} columns defined • ${record.category}`,
            record,
          }));
          return NextResponse.json({
            status: "SUCCESS",
            statusCode: 200,
            message: "Model config catalog loaded from fixture",
            data: list,
            timestamp: new Date().toISOString(),
          });
        }

        if (STATIC_MODEL_CONFIGS[targetId]) {
          return NextResponse.json({
            status: "SUCCESS",
            statusCode: 200,
            message: `Model config for #${targetId} loaded from fixture`,
            data: STATIC_MODEL_CONFIGS[targetId],
            timestamp: new Date().toISOString(),
          });
        }
      }

      // C. Form Record Requests
      const modelTable = STATIC_FORM_DATA[cleanModel];
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

      // If static fixture does not contain this specific record, return immediately without touching gRPC
      return NextResponse.json({
        status: "RECORD_NOT_FOUND",
        statusCode: 200,
        message: `Record #${body.recordId || ""} not found in offline fixture.`,
        data: null,
        timestamp: new Date().toISOString(),
      });
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
        return NextResponse.json(response, { status: 200 });
      }
    } catch {
      // Backend not running / gRPC offline: fall through to fixture fallback below
    }

    // Graceful Fallback for gRPC mode if backend server is unreachable
    const modelTable = STATIC_FORM_DATA[cleanModel];
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
