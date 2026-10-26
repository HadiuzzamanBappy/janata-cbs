import { type NextRequest, NextResponse } from "next/server";
import { parseAccessibilityRights } from "@/lib/cbs-access";
import { appConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { decodeProtobufValue, parseInquiryRecords } from "@/lib/data-parsers";
import { cbsWirePayloadSchema, type GrpcEnvelope } from "@/lib/data-schemas";
import { dispatch } from "@/lib/infra-grpc";
import { getSession, invalidateCache } from "@/lib/infra-redis";
import { type ApiResponse, CbsRecordFunction, DEFAULT_SERVICE_PATH } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const proxyLogger = logger.withContext("PROXY_API");

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();

    if (!session?.currUser) {
      return NextResponse.json(
        {
          success: false,
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
    // 0. SERVER-SIDE CAPABILITY GATE (Maker-Checker & RIDASHL Verification)
    // =========================================================================
    if (body.recordFunction) {
      const userGrantedRights = parseAccessibilityRights(
        currUser.functionRights?.length ? currUser.functionRights : currUser.accessibility,
      );
      const funcCode = body.recordFunction.toUpperCase().trim() as CbsRecordFunction;

      // Restrict mutations/approvals if user does not have the required right
      if (
        (funcCode === CbsRecordFunction.AUTHORIZE ||
          funcCode === CbsRecordFunction.DELETE ||
          funcCode === CbsRecordFunction.REVERSE ||
          funcCode === CbsRecordFunction.HOLD ||
          funcCode === CbsRecordFunction.INPUT) &&
        !userGrantedRights.includes(funcCode)
      ) {
        proxyLogger.warn(`Access Denied: Missing '${funcCode}' for user ${currUser.userId}`, {
          controlName: body.controlName,
          recordId: body.recordId,
        });
        return NextResponse.json(
          {
            success: false,
            status: "FAIL",
            statusCode: 403,
            message: `Access Denied: Missing '${funcCode}' capability in user profile.`,
            errors: [`User ${currUser.userId} lacks capability '${funcCode}'`],
            timestamp: new Date().toISOString(),
          },
          { status: 403 },
        );
      }
    }

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
      idempotencyKey: body.idempotencyKey,
      userId,
      clientId: appConfig.grpc.clientId,
      data: body.data ?? {},
    };

    try {
      const response = await dispatch(envelope, token);

      if (response.status === "SUCCESS") {
        // Evict cached specs so model and layout mutations take immediate effect without manual purge
        const ctrl = (envelope.controlName || "").toUpperCase();
        const isMutationOrAuth =
          envelope.requestType === "PUT" ||
          envelope.requestType === "AUT" ||
          envelope.recordFunction === "I" ||
          envelope.recordFunction === "A";

        if (isMutationOrAuth && (ctrl === "MODEL.CONFIG" || ctrl === "FORM.CONFIG")) {
          const payloadData = envelope.data as Record<string, unknown> | undefined;
          const targetModel =
            (payloadData?.targetModel as string) ||
            (payloadData?.tableName as string) ||
            envelope.recordId ||
            "";
          if (targetModel.trim()) {
            await invalidateCache(targetModel.trim());
          }
        }

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

      // Backend may reply ERROR with an empty message (unhandled host exception);
      // give the client something actionable instead of a blank toast.
      const fallbackMessage = `CBS host returned ${response.status} (${response.statusCode}) for ${envelope.requestType} on ${envelope.controlName || "default"}`;
      proxyLogger.warn(`Proxy downstream returned non-success (${response.statusCode})`, {
        controlName: envelope.controlName,
        requestType: envelope.requestType,
        message: response.message || fallbackMessage,
      });
      return NextResponse.json(
        {
          ...response,
          message: response.message || fallbackMessage,
          errors: response.errors?.length ? response.errors : [fallbackMessage],
          success: false,
        },
        {
          status: response.statusCode || 400,
        },
      );
    } catch (dispatchErr: unknown) {
      proxyLogger.error("CBS Host communication failed", dispatchErr);
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
    proxyLogger.error("Internal Proxy Dispatch Error", err);
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
