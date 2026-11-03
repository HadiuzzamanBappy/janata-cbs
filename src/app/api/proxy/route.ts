import { type NextRequest, NextResponse } from "next/server";
import { parseAccessibilityRights } from "@/lib/cbs-access";
import { appConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { decodeProtobufValue, parseInquiryRecords } from "@/lib/data-parsers";
import { type ApiResponse, cbsWirePayloadSchema, type GrpcEnvelope } from "@/lib/data-schemas";
import { dispatch } from "@/lib/infra-grpc";
import { getSession, invalidateCache } from "@/lib/infra-redis";
import { CbsControlTable, CbsRecordFunction } from "@/types";
import { apiError, apiFail } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const proxyLogger = logger.withContext("PROXY_API");

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();

    if (!session?.currUser) {
      return apiFail("User session expired or unauthorized", 401);
    }

    const { token, userId, currUser } = session;
    const rawBody = await req.json();
    const parsed = cbsWirePayloadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return apiFail(
        parsed.error.issues[0]?.message || "Invalid proxy request payload",
        400,
        parsed.error.issues.map((i) => i.message),
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

      // Restrict mutations/approvals if user lacks the capability
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
        return apiFail(`Access Denied: Missing '${funcCode}' capability in user profile.`, 403, [
          `User ${currUser.userId} lacks capability '${funcCode}'`,
        ]);
      }
    }

    // Direct, canonical branch code resolution
    const resolvedBranchCode =
      parsed.data.branchCode || currUser.branchCode || appConfig.centralBranch;

    const envelope: GrpcEnvelope = {
      servicePath: body.servicePath || "default",
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
        // Evict cached specs on mutation or authorization
        const ctrl = (envelope.controlName || "").toUpperCase();
        const isMutationOrAuth =
          envelope.requestType === "PUT" ||
          envelope.requestType === "AUT" ||
          envelope.recordFunction === "I" ||
          envelope.recordFunction === "A";

        if (
          isMutationOrAuth &&
          (ctrl === CbsControlTable.MODEL_CONFIG ||
            ctrl === CbsControlTable.FORM_CONFIG ||
            ctrl === CbsControlTable.INQUIRY_CONFIG ||
            ctrl === CbsControlTable.MENU ||
            ctrl === CbsControlTable.MENU_TREE)
        ) {
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

      // Actionable failure notification from downstream core
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
        { status: response.statusCode || 400 },
      );
    } catch (dispatchErr: unknown) {
      proxyLogger.error("CBS Host communication failed", dispatchErr);
      return apiError(dispatchErr, "CBS Host communication failed", 502);
    }
  } catch (err: unknown) {
    proxyLogger.error("Internal Proxy Dispatch Error", err);
    return apiError(err, "Internal Proxy Dispatch Error");
  }
}
