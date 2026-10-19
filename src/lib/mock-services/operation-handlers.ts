import "server-only";

import {
  SC_BRANCH_LIST,
  SC_CONTROL_LIST,
  SC_INQUIRY_CONFIG_LIVE,
  SC_MENU_TREE_LIVE,
  SC_MODEL_CONFIG_LIVE,
} from "@fixtures";
import { resolveTable } from "./database-router";
import { notFoundResult, successResult } from "./response-factory";
import type { MockProxyResult, OperationContext } from "./types";

/* -------------------------------------------------------------------------- */
/* Canonical Wire Payload Accessors                                           */
/* -------------------------------------------------------------------------- */

export function getMockMenuPayload(): unknown {
  return {
    records: SC_MENU_TREE_LIVE["MENU.MAIN"]?.menuTree ?? [],
  };
}

export function getMockBranchesPayload(): unknown {
  return {
    records: SC_BRANCH_LIST,
  };
}

export function getMockControlsPayload(): unknown {
  return {
    records: SC_CONTROL_LIST,
  };
}

export function getMockFormPayload(command: string): unknown {
  const clean = command.trim().toUpperCase().split(",")[0].trim();
  const resolved = clean === "USER.MGT" ? "USER" : clean;
  const model =
    SC_MODEL_CONFIG_LIVE[resolved] ||
    SC_MODEL_CONFIG_LIVE[clean] ||
    SC_MODEL_CONFIG_LIVE[clean.replace(/\./g, "_")] ||
    SC_MODEL_CONFIG_LIVE[clean.replace(/_/g, ".")];
  if (!model) return null;

  return {
    record: {
      tableName: model.tableName,
      description: model.description,
      prefix: model.prefix,
      idDef: model.idDef,
      properties: model.properties,
      auditData: model.auditData,
    },
  };
}

export function getMockInquiryPayload(command: string): unknown {
  return SC_INQUIRY_CONFIG_LIVE[command.trim().toUpperCase()] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Protocol Operation Handlers                                                */
/* -------------------------------------------------------------------------- */

/** Handles GUM (Get User Menu) */
export function handleGetMenu(): MockProxyResult {
  return successResult(getMockMenuPayload(), "Menu loaded from simulated database");
}

/** Handles GMC (Get Model Configuration) */
export function handleGetModelConfig(ctx: OperationContext): MockProxyResult {
  const target = ctx.recordId || ctx.controlName;
  const formPayload = getMockFormPayload(target);
  if (!formPayload) {
    return notFoundResult(`Form schema for ${target} not found`);
  }
  return successResult(formPayload, "Form schema loaded from simulated database");
}

/** Handles INQ (Dynamic Inquiry Execution) */
export function handleInquiry(ctx: OperationContext): MockProxyResult {
  if (ctx.controlName === "ACCOUNT" || ctx.recordId === "ACCOUNT") {
    const accountTable = resolveTable("ACCOUNT");
    return successResult(accountTable?.getList() ?? [], "Account inquiry loaded");
  }

  const inqSpec = SC_INQUIRY_CONFIG_LIVE[ctx.controlName] || SC_INQUIRY_CONFIG_LIVE[ctx.recordId];

  if (inqSpec) {
    const targetModel = (inqSpec.targetModel || "").trim().toUpperCase();
    const table = resolveTable(targetModel);
    return successResult(table?.getList() ?? [], "Inquiry data loaded from canonical table");
  }

  return successResult([], "No inquiry records found in fixture");
}

/** Handles GRL (Generic Record List) */
export function handleRecordList(ctx: OperationContext): MockProxyResult {
  const table = resolveTable(ctx.controlName);
  if (!table) {
    return notFoundResult(`Table ${ctx.controlName} not found in database`);
  }
  return successResult(table.getList(), `${ctx.controlName} list loaded`);
}

/** Handles GET (Single Record Query) */
export function handleGetRecord(ctx: OperationContext): MockProxyResult {
  if (!ctx.recordId || ctx.recordId === "LIST" || ctx.recordId === "ALL") {
    return handleRecordList(ctx);
  }

  const table = resolveTable(ctx.controlName);
  if (!table) {
    return notFoundResult(`Table ${ctx.controlName} not found in database`);
  }

  const record =
    table.LIVE[ctx.recordId] ||
    (table.prefix ? table.LIVE[`${table.prefix}${ctx.recordId}`] : null) ||
    (table.prefix ? table.LIVE[ctx.recordId.replace(new RegExp(`^${table.prefix}`), "")] : null);

  if (!record) {
    return notFoundResult(`Record #${ctx.recordId} not found in database table ${ctx.controlName}`);
  }

  return successResult(record, `${ctx.controlName} record loaded`);
}

/** Handles GNI (Get Next Sequence ID) */
export function handleNextId(ctx: OperationContext): MockProxyResult {
  const model = SC_MODEL_CONFIG_LIVE[ctx.controlName];
  const prefix =
    model?.idDef?.idPrefix ||
    (ctx.controlName === "ACCOUNT"
      ? "100"
      : ctx.controlName === "CUSTOMER"
        ? "200"
        : `${ctx.controlName}.`);

  const generatedId = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
  return successResult(
    { recordId: generatedId, id: generatedId },
    `Generated next record sequence for ${ctx.controlName}`,
  );
}

/** Handles Mutations (PUT, AUT, DEL, HLD, REV) */
export function handleMutation(ctx: OperationContext): MockProxyResult {
  const statusMap: Record<string, { label: string; code: string }> = {
    AUT: { label: "authorized", code: "AU" },
    HLD: { label: "held", code: "HLD" },
    DEL: { label: "deleted", code: "DEL" },
    REV: { label: "reversed", code: "REV" },
  };

  const { label, code } = statusMap[ctx.requestType] || {
    label: "saved",
    code: "INA",
  };
  const targetId = ctx.recordId || (ctx.data?.id as string) || "REC-001";

  return successResult(
    {
      recordId: targetId,
      ...(ctx.data || {}),
      RECORD_STATUS: code,
    },
    `Record #${targetId} ${label} successfully in ${ctx.controlName || "CBS"}`,
  );
}
