import "server-only";

import { SC_MODEL_CONFIG } from "@mock/db";
import type { CbsWirePayload } from "@/lib/data-schemas";
import { type ApiResponse, CbsControlTable } from "@/types";
import { resolveTable } from "../database-router";
import { errorResult, successResult } from "../response-factory";

/**
 * Handles GNI (Get Next Sequence ID or User-Defined Draft Initialization).
 */
export function handleNextId(payload: CbsWirePayload): ApiResponse {
  const clean = (payload.controlName || "").trim().toUpperCase();
  const table = resolveTable(clean);
  const inputId = (payload.recordId || "").trim().toUpperCase();

  // 1. If an ID was provided and it already exists in the table, return existing record in Edit Mode
  if (inputId && table) {
    const existing =
      table.LIVE[inputId] || (table.prefix && table.LIVE[`${table.prefix}${inputId}`]);

    if (existing) {
      const rec = typeof existing === "object" ? existing : {};
      return successResult(
        { recordId: inputId, id: inputId, ...rec, _isExisting: true },
        `Existing ${clean} record #${inputId} loaded for edit`,
      );
    }
  }

  // 2. Resolve Model schema metadata to check ID definition
  const modelTable = resolveTable(CbsControlTable.MODEL_CONFIG);
  const model = (modelTable?.LIVE[clean] ||
    SC_MODEL_CONFIG[clean] ||
    Object.values(SC_MODEL_CONFIG).find(
      (m) => m.TABLENAME === clean || `${m.PREFIX}_${m.TABLENAME}` === clean,
    )) as (typeof SC_MODEL_CONFIG)[keyof typeof SC_MODEL_CONFIG] | undefined;

  const isUserDefineId = Boolean(model?.USERDEFINEID);

  // 3. User-defined models require the operator to specify the Record ID
  if (isUserDefineId) {
    if (!inputId) {
      return errorResult(
        400,
        `${clean} has userDefineId enabled. Please enter a Record ID before clicking (+) New.`,
      );
    }

    return successResult(
      {
        recordId: inputId,
        id: inputId,
        tableName: inputId.replace(/[.-]/g, "_"),
        _isNew: true,
      },
      `Initialized user-defined draft for ${clean} #${inputId}`,
    );
  }

  // 4. Otherwise, system auto-allocates next sequence number (e.g. ACCOUNT -> AC1004)
  const prefix = model?.IDDEF?.IDPREFIX || model?.PREFIX || clean.slice(0, 2);
  const generatedId = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
  return successResult(
    { recordId: generatedId, id: generatedId, _isNew: true },
    `Generated next record sequence for ${clean}`,
  );
}

/**
 * Handles Mutations (PUT, AUT, DEL, HLD, REV, TRV, SMC, AMC, SFC, ATT, CTT, AFT)
 * with consistent dual-control audit status transitions.
 */
export function handleMutation(payload: CbsWirePayload): ApiResponse {
  const reqType = (payload.requestType || "").trim().toUpperCase();
  const statusMap: Record<string, { label: string; code: string }> = {
    AUT: { label: "authorized", code: "AU" },
    AMC: { label: "authorized", code: "AU" },
    HLD: { label: "held", code: "HLD" },
    DEL: { label: "deleted", code: "DEL" },
    REV: { label: "reversed", code: "REV" },
    TRV: { label: "reversed", code: "REV" },
    PUT: { label: "saved", code: "INA" },
    SMC: { label: "saved", code: "INA" },
    SFC: { label: "saved", code: "INA" },
    SMR: { label: "saved", code: "INA" },
    DTR: { label: "deleted", code: "DEL" },
    ATT: { label: "executed", code: "AU" },
    CTT: { label: "executed", code: "AU" },
    AFT: { label: "executed", code: "AU" },
  };

  const { label, code } = statusMap[reqType] || {
    label: "saved",
    code: "INA",
  };

  const targetId =
    payload.recordId ||
    (payload.data?.id as string) ||
    (payload.data?.recordId as string) ||
    "REC-001";

  const cmd = (payload.controlName || "").trim().toUpperCase();
  const table = resolveTable(cmd);
  const existingRecord = table?.LIVE[targetId] || {};
  const currentAudit = (existingRecord.auditData as Record<string, unknown> | undefined) || {};

  const updatedRecord = {
    ...existingRecord,
    ...(payload.data || {}),
    recordId: targetId,
    id: targetId,
    RECORD_STATUS: code,
    auditData: {
      ...currentAudit,
      recStatus: code,
      recCurrNumber: Number(currentAudit.recCurrNumber || 1) + (code === "AU" ? 1 : 0),
      recBranchCode: payload.branchCode || currentAudit.recBranchCode,
      ...(code === "AU"
        ? {
            recAuthorizer:
              (payload.data?.recAuthorizer as string) ||
              (payload.data?.userId as string) ||
              "CHECKER",
            recAuthTime: new Date().toISOString(),
          }
        : {
            recInputter:
              (payload.data?.recInputter as string) || (payload.data?.userId as string) || "MAKER",
            recInputTime: new Date().toISOString(),
          }),
    },
  };

  if (table?.LIVE) {
    table.LIVE[targetId] = updatedRecord;
  }

  return successResult(
    updatedRecord,
    `Record #${targetId} ${label} successfully in ${payload.controlName || "CBS"}`,
  );
}
