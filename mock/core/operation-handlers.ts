import {
  SC_FORM_CONFIG,
  SC_INQUIRY_CONFIG,
  SC_MENU_TREE,
  SC_MODEL_CONFIG,
} from "@mock/db";
import type { CbsWirePayload } from "@/lib/data-schemas";
import type { ApiResponse } from "@/types";
import { resolveTable } from "./database-router";
import { errorResult, notFoundResult, successResult } from "./response-factory";

/* -------------------------------------------------------------------------- */
/* Canonical Wire Payload Accessors                                           */
/* -------------------------------------------------------------------------- */

export function getMockMenuPayload(): unknown {
  return SC_MENU_TREE["MENU.MAIN"]?.menuTree ?? [];
}

export function getMockFormPayload(command: string): unknown {
  const clean = command.trim().toUpperCase();

  // 1. If explicit Form Config exists (e.g. ACCOUNT,1.0.0 or USER,1.0.0), return layout
  if (SC_FORM_CONFIG[clean]) {
    return SC_FORM_CONFIG[clean];
  }

  // 2. Otherwise return base Model Config
  const baseModel = clean.split(",")[0].trim();
  return SC_MODEL_CONFIG[baseModel] || SC_MODEL_CONFIG[clean] || null;
}

export function getMockInquiryPayload(command: string): unknown {
  const clean = command
    .trim()
    .toUpperCase()
    .replace(/^(?:INQ\s+|INQUIRY\s+)/i, "")
    .replace(/^(?:[SRIDAH]\s+)/i, "")
    .trim();

  // 1. If explicit Inquiry Config exists in SC_INQUIRY_CONFIG, return it
  if (SC_INQUIRY_CONFIG[clean]) {
    return SC_INQUIRY_CONFIG[clean];
  }

  // 2. Fallback: Synthesize raw Model Inquiry dynamically from MODEL.CONFIG properties
  const model =
    SC_MODEL_CONFIG[clean] ||
    Object.values(SC_MODEL_CONFIG).find((m) => m.tableName === clean);

  if (!model) return null;

  const rawProps = Array.isArray(model.properties) ? model.properties : [];

  // Build inquiry columns from model properties
  const columns = rawProps.map((prop) => {
    const isAmount = prop.type?.toLowerCase() === "amount";
    const isDate = prop.type?.toLowerCase() === "date";
    const isNumber = prop.type?.toLowerCase() === "number";

    return {
      id: prop.name,
      label: prop.label || prop.name,
      align: isAmount || isNumber ? "right" : isDate ? "center" : "left",
      width: isAmount ? "140px" : isDate ? "120px" : "150px",
      format: isAmount ? "amount" : isDate ? "date" : "text",
      isMono: Boolean(prop.name.toLowerCase().includes("id") || prop.sn === "1"),
      sortable: true,
      visible: true,
      isPinned: false,
    };
  });

  // Build inquiry filters from active model properties
  const filters = rawProps
    .filter((prop) => !prop.disabled)
    .map((prop) => {
      const pType = prop.type?.toLowerCase();
      const filterType =
        pType === "date" ? "date" : pType === "number" || pType === "amount" ? "number" : "text";

      return {
        id: prop.name,
        label: prop.label || prop.name,
        type: filterType,
        defaultOperand: "EQ",
        defaultValue: "",
        required: Boolean(prop.required),
      };
    });

  return {
    id: clean,
    code: clean,
    title: `${model.description || clean} Inquiry`,
    description: `Auto-generated raw model inquiry for ${clean}`,
    controllerName: clean,
    pageOrientation: "Landscape",
    showSerial: true,
    showPagination: true,
    columns,
    filters,
    actions: [
      {
        id: "view_rec",
        label: "View",
        targetCommand: clean,
        actionType: "view",
        icon: "eye",
        openMode: "tab",
      },
      {
        id: "edit_rec",
        label: "Edit",
        targetCommand: clean,
        actionType: "edit",
        icon: "edit",
        openMode: "tab",
      },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* Protocol Operation Handlers                                                */
/* -------------------------------------------------------------------------- */

/** Handles GUM (Get User Menu) */
export function handleGetMenu(): ApiResponse {
  return successResult(getMockMenuPayload(), "Menu loaded from simulated database");
}

/** Handles GMC (Get Model Configuration) */
export function handleGetModelConfig(payload: CbsWirePayload): ApiResponse {
  const target = (payload.recordId || payload.controlName || "").trim().toUpperCase();
  const formPayload = getMockFormPayload(target);
  if (!formPayload) {
    return notFoundResult(`Form schema for ${target} not found`);
  }
  return successResult(formPayload, "Form schema loaded from simulated database");
}

/** Handles INQ (Dynamic Inquiry Execution) */
export function handleInquiry(payload: CbsWirePayload): ApiResponse {
  const cleanKey = (payload.controlName || payload.recordId || "").trim().toUpperCase();
  const inqSpec = SC_INQUIRY_CONFIG[cleanKey];

  if (inqSpec) {
    const targetModel = String(inqSpec.controllerName || inqSpec.targetModel || cleanKey).trim().toUpperCase();
    const table = resolveTable(targetModel);
    return successResult(table?.getList() ?? [], "Inquiry data loaded from canonical table");
  }

  // Fallback: If querying a direct table name through INQ (e.g. INQ ACCOUNT)
  const directTable = resolveTable(cleanKey);
  if (directTable) {
    return successResult(directTable.getList(), `Inquiry data loaded for ${cleanKey}`);
  }

  return successResult([], "No inquiry records found in fixture");
}

/** Handles GRL (Generic Record List for Catalogs and Lookups) */
export function handleRecordList(payload: CbsWirePayload): ApiResponse {
  const cmd = (payload.controlName || "").trim().toUpperCase();
  const table = resolveTable(cmd);
  if (!table) {
    return notFoundResult(`Table ${cmd} not found in database`);
  }
  return successResult(table.getList(), `${cmd} record collection loaded`);
}

/** Handles SBI (Search by recordId / wildcard) */
export function handleSearchById(payload: CbsWirePayload): ApiResponse {
  const cmd = (payload.controlName || "").trim().toUpperCase();
  const table = resolveTable(cmd);
  if (!table) {
    return notFoundResult(`Table ${cmd} not found in database`);
  }
  const searchPattern = payload.recordId || "";
  return successResult(table.getIdList(searchPattern), `${cmd} ID list loaded`);
}

/** Handles S / SEE (Read / View Single Record) */
export function handleSeeRecord(payload: CbsWirePayload): ApiResponse {
  const recId = (payload.recordId || "").trim();
  if (!recId) {
    return notFoundResult("Missing recordId for SEE / View request");
  }

  const cmd = (payload.controlName || "").trim().toUpperCase();
  const table = resolveTable(cmd);
  if (!table) {
    return notFoundResult(`Table ${cmd} not found in database`);
  }

  const upperId = recId.toUpperCase();
  const hasVersion = upperId.includes(",");
  const compositeKey = hasVersion
    ? `${upperId.split(",")[0].trim()},${upperId.split(",")[1].trim()}`
    : "";

  // Direct, clean key resolution: exact key, uppercase key, composite key, or prefix-prepended key
  const rawRecord =
    table.LIVE[recId] ||
    table.LIVE[upperId] ||
    (compositeKey ? table.LIVE[compositeKey] : undefined) ||
    (table.prefix ? table.LIVE[`${table.prefix}${upperId}`] : undefined);

  if (!rawRecord) {
    // If querying INQUIRY.CONFIG table for a model without custom inquiry, synthesize raw schema
    if (cmd === "INQUIRY.CONFIG") {
      const fallbackInquiry = getMockInquiryPayload(recId);
      if (fallbackInquiry) {
        return successResult(fallbackInquiry, `Synthesized raw model inquiry for ${recId}`);
      }
    }

    return notFoundResult(`Record #${recId} not found in database table ${cmd}`);
  }

  const resolvedId = (rawRecord.recordId || rawRecord.id || recId) as string;
  const hasComma = recId.includes(",");
  const targetModel =
    rawRecord.targetModel ||
    rawRecord.controllerName ||
    (hasComma ? recId.split(",")[0].trim() : undefined);
  const version = rawRecord.version || (hasComma ? recId.split(",")[1]?.trim() : undefined);

  const recordWithId = {
    recordId: resolvedId,
    id: resolvedId,
    ...(targetModel ? { targetModel } : {}),
    ...(version ? { version } : {}),
    ...rawRecord,
  };

  return successResult(recordWithId, `${cmd} record loaded`);
}

/** Handles GNI (Get Next Sequence ID or User-Defined Draft Initialization) */
export function handleNextId(payload: CbsWirePayload): ApiResponse {
  const clean = (payload.controlName || "").trim().toUpperCase();
  const table = resolveTable(clean);
  const inputId = (payload.recordId || "").trim().toUpperCase();

  // 1. If an ID was provided and it already exists in the table, return existing record in Edit Mode
  if (inputId && table) {
    const existing =
      table.LIVE[inputId] ||
      (table.prefix && table.LIVE[`${table.prefix}${inputId}`]);

    if (existing) {
      const rec = typeof existing === "object" ? existing : {};
      return successResult(
        { recordId: inputId, id: inputId, ...rec, _isExisting: true },
        `Existing ${clean} record #${inputId} loaded for edit`,
      );
    }
  }

  // 2. Resolve Model schema metadata to check ID definition
  const model = SC_MODEL_CONFIG[clean];
  const isUserDefineId = Boolean(model?.userDefineId) || clean === "MODEL.CONFIG";

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
  const prefix = model?.idDef?.idPrefix || model?.prefix || clean.slice(0, 2);
  const generatedId = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
  return successResult(
    { recordId: generatedId, id: generatedId, _isNew: true },
    `Generated next record sequence for ${clean}`,
  );
}

/** Handles Mutations (PUT, AUT, DEL, HLD, REV) with consistent audit status */
export function handleMutation(payload: CbsWirePayload): ApiResponse {
  const reqType = (payload.requestType || "").trim().toUpperCase();
  const statusMap: Record<string, { label: string; code: string }> = {
    AUT: { label: "authorized", code: "AU" },
    AMC: { label: "authorized", code: "AU" },
    HLD: { label: "held", code: "HLD" },
    DEL: { label: "deleted", code: "DEL" },
    REV: { label: "reversed", code: "REV" },
    PUT: { label: "saved", code: "INA" },
    SMC: { label: "saved", code: "INA" },
    SFC: { label: "saved", code: "INA" },
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
