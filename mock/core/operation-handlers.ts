import {
  SC_FORM_CONFIG_LIVE,
  SC_INQUIRY_CONFIG_LIVE,
  SC_MENU_TREE_LIVE,
  SC_MODEL_CONFIG_LIVE,
} from "@mock/db";
import type { ApiResponse, CbsWirePayload } from "@/types";
import { resolveTable } from "./database-router";
import { errorResult, notFoundResult, successResult } from "./response-factory";

/* -------------------------------------------------------------------------- */
/* Canonical Wire Payload Accessors                                           */
/* -------------------------------------------------------------------------- */

export function getMockMenuPayload(): unknown {
  return SC_MENU_TREE_LIVE["MENU.MAIN"]?.menuTree ?? [];
}

export function getMockFormPayload(command: string): unknown {
  const clean = command.trim().toUpperCase();

  // 1. If explicit Form Config exists (e.g. ACCOUNT,1.0.0 or USER,1.0.0), return the form layout
  if (SC_FORM_CONFIG_LIVE[clean]) {
    return SC_FORM_CONFIG_LIVE[clean];
  }

  // 2. Otherwise return base Model Config (raw table schema)
  const baseModel = clean.split(",")[0].trim();
  return SC_MODEL_CONFIG_LIVE[baseModel] || SC_MODEL_CONFIG_LIVE[clean] || null;
}

export function getMockInquiryPayload(command: string): unknown {
  const clean = command
    .trim()
    .toUpperCase()
    .replace(/^(?:INQ\s+|INQUIRY\s+)/i, "")
    .replace(/^(?:[SRIDAH]\s+)/i, "")
    .trim();

  // 1. If explicit Inquiry Config exists in SC_INQUIRY_CONFIG (e.g. ACCOUNT), return it
  if (SC_INQUIRY_CONFIG_LIVE[clean]) {
    return SC_INQUIRY_CONFIG_LIVE[clean];
  }

  // 2. Fallback: Synthesize raw Model Inquiry from MODEL.CONFIG
  const model =
    SC_MODEL_CONFIG_LIVE[clean] ||
    SC_MODEL_CONFIG_LIVE[clean.replace(/\./g, "_")] ||
    SC_MODEL_CONFIG_LIVE[clean.replace(/_/g, ".")];

  if (!model) return null;

  // Use model.properties, or fallback to core model definition attributes if properties is empty
  const rawProps =
    Array.isArray(model.properties) && model.properties.length > 0
      ? model.properties
      : [
          { sn: "1", name: "tableName", label: "Table Name", type: "Text" as const, length: 50, required: true, disabled: false, status: "ACTIVE" as const, structure: "S" as const },
          { sn: "2", name: "description", label: "Description", type: "Text" as const, length: 100, required: true, disabled: false, status: "ACTIVE" as const, structure: "S" as const },
          { sn: "3", name: "category", label: "Category", type: "Text" as const, length: 30, required: false, disabled: false, status: "ACTIVE" as const, structure: "S" as const },
          { sn: "4", name: "access", label: "Access Level", type: "Text" as const, length: 10, required: true, disabled: false, status: "ACTIVE" as const, structure: "S" as const },
          { sn: "5", name: "userDefineId", label: "User Defined ID", type: "Boolean" as const, length: 1, required: false, disabled: false, status: "ACTIVE" as const, structure: "S" as const },
          { sn: "6", name: "isActive", label: "Is Active", type: "Boolean" as const, length: 1, required: false, disabled: false, status: "ACTIVE" as const, structure: "S" as const },
        ];

  // Build columns from model properties
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

  // Build filter fields from all non-disabled model properties
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

  // Return synthesized Enquiry spec contract
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
        targetCommand: `${clean},SEE`,
        actionType: "view",
        icon: "eye",
        openMode: "tab",
      },
      {
        id: "edit_rec",
        label: "Edit",
        targetCommand: `${clean},EDIT`,
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
  const inqSpec =
    SC_INQUIRY_CONFIG_LIVE[cleanKey] ||
    (payload.controlName ? SC_INQUIRY_CONFIG_LIVE[payload.controlName] : undefined) ||
    (payload.recordId ? SC_INQUIRY_CONFIG_LIVE[payload.recordId] : undefined);

  if (inqSpec) {
    const targetModel = String(inqSpec.controllerName || inqSpec.targetModel || cleanKey)
      .trim()
      .toUpperCase();
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
  const baseKey = upperId.split(",")[0].trim();
  const versionKey = hasVersion ? upperId.split(",")[1].trim() : "";
  const compositeKey = hasVersion ? `${baseKey},${versionKey}` : "";

  const matchingKey =
    (table.LIVE[recId] ? recId : null) ||
    (table.LIVE[upperId] ? upperId : null) ||
    (compositeKey && table.LIVE[compositeKey] ? compositeKey : null) ||
    (!hasVersion && table.LIVE[baseKey] ? baseKey : null) ||
    (table.prefix && table.LIVE[`${table.prefix}${recId}`] ? `${table.prefix}${recId}` : null) ||
    (table.prefix && table.LIVE[`${table.prefix}${upperId}`]
      ? `${table.prefix}${upperId}`
      : null) ||
    Object.keys(table.LIVE).find(
      (k) => k.toUpperCase() === upperId || (compositeKey && k.toUpperCase() === compositeKey),
    );

  const rawRecord = matchingKey ? table.LIVE[matchingKey] : null;

  if (!rawRecord || !matchingKey) {
    // If querying INQUIRY.CONFIG table for a model (e.g. MODEL.CONFIG or USER) and no custom inquiry config exists,
    // dynamically synthesize raw inquiry schema from MODEL.CONFIG properties!
    if (cmd === "INQUIRY.CONFIG" || cmd === "CONFIG.INQUIRY" || cmd === "INQUIRY_CONFIG") {
      const fallbackInquiry = getMockInquiryPayload(recId);
      if (fallbackInquiry) {
        return successResult(fallbackInquiry, `Synthesized raw model inquiry for ${recId}`);
      }
    }

    return notFoundResult(`Record #${recId} not found in database table ${cmd}`);
  }

  const hasComma = matchingKey.includes(",");
  const targetModel =
    rawRecord.targetModel ||
    rawRecord.controllerName ||
    (hasComma ? matchingKey.split(",")[0].trim() : undefined);
  const version = rawRecord.version || (hasComma ? matchingKey.split(",")[1]?.trim() : undefined);

  const resolvedId = (rawRecord.recordId || rawRecord.id || matchingKey) as string;

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

  // 1. If an ID was provided and it already exists in the table, return the existing record in Edit Mode
  if (inputId && table) {
    const existing =
      table.LIVE[inputId] ||
      (table.prefix && table.LIVE[`${table.prefix}${inputId}`]) ||
      Object.keys(table.LIVE).find((k) => k.toUpperCase() === inputId && table.LIVE[k]);

    if (existing) {
      const rec = typeof existing === "object" ? existing : {};
      return successResult(
        { recordId: inputId, id: inputId, ...rec, _isExisting: true },
        `Existing ${clean} record #${inputId} loaded for edit`,
      );
    }
  }

  // 2. Resolve Model schema metadata to check ID definition
  const model =
    SC_MODEL_CONFIG_LIVE[clean] ||
    SC_MODEL_CONFIG_LIVE[clean.replace(/\./g, "_")] ||
    SC_MODEL_CONFIG_LIVE[clean.replace(/_/g, ".")];

  const isUserDefineId = Boolean(model?.userDefineId) || clean === "MODEL.CONFIG" || clean === "CONFIG.MODEL";

  // 3. If model is userDefineId:
  //    - If user provided an ID: initialize draft with that ID.
  //    - If user did NOT provide an ID: return error! User-defined models require the user to specify an ID.
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
        tableName: inputId.replace(/[\.-]/g, "_"),
        _isNew: true,
      },
      `Initialized user-defined draft for ${clean} #${inputId}`,
    );
  }

  // 4. Otherwise, model uses system sequence allocation (e.g. ACCOUNT)
  const prefix = model?.idDef?.idPrefix || model?.prefix || clean.slice(0, 2);
  const generatedId = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
  return successResult(
    { recordId: generatedId, id: generatedId, _isNew: true },
    `Generated next record sequence for ${clean}`,
  );
}

/** Handles Mutations (PUT, AUT, DEL, HLD, REV) */
export function handleMutation(payload: CbsWirePayload): ApiResponse {
  const reqType = (payload.requestType || "").trim().toUpperCase();
  const statusMap: Record<string, { label: string; code: string }> = {
    AUT: { label: "authorized", code: "AU" },
    HLD: { label: "held", code: "HLD" },
    DEL: { label: "deleted", code: "DEL" },
    REV: { label: "reversed", code: "REV" },
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
  const updatedRecord = {
    ...(table?.LIVE[targetId] || {}),
    ...(payload.data || {}),
    recordId: targetId,
    id: targetId,
    RECORD_STATUS: code,
  };

  if (table?.LIVE) {
    table.LIVE[targetId] = updatedRecord;
  }

  return successResult(
    updatedRecord,
    `Record #${targetId} ${label} successfully in ${payload.controlName || "CBS"}`,
  );
}
