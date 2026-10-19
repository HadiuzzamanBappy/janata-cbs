import "server-only";

import { SC_INQUIRY_CONFIG_LIVE, SC_MENU_TREE_LIVE, SC_MODEL_CONFIG_LIVE } from "@mock/db";
import type { ApiResponse, CbsWirePayload } from "@/types";
import { resolveTable } from "./database-router";
import { notFoundResult, successResult } from "./response-factory";

/* -------------------------------------------------------------------------- */
/* Canonical Wire Payload Accessors                                           */
/* -------------------------------------------------------------------------- */

export function getMockMenuPayload(): unknown {
  return {
    records: SC_MENU_TREE_LIVE["MENU.MAIN"]?.menuTree ?? [],
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
    const targetModel = (inqSpec.targetModel || cleanKey).trim().toUpperCase();
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

/** Handles GRL (Generic Record List) */
export function handleRecordList(payload: CbsWirePayload): ApiResponse {
  const cmd = (payload.controlName || "").trim().toUpperCase();
  const table = resolveTable(cmd);
  if (!table) {
    return notFoundResult(`Table ${cmd} not found in database`);
  }
  return successResult(table.getList(), `${cmd} list loaded`);
}

/** Handles GET (Single Record Query) */
export function handleGetRecord(payload: CbsWirePayload): ApiResponse {
  const recId = (payload.recordId || "").trim();
  if (!recId || recId.toUpperCase() === "LIST" || recId.toUpperCase() === "ALL") {
    return handleRecordList(payload);
  }

  const cmd = (payload.controlName || "").trim().toUpperCase();
  const table = resolveTable(cmd);
  if (!table) {
    return notFoundResult(`Table ${cmd} not found in database`);
  }

  const upperId = recId.toUpperCase();

  const rawRecord =
    table.LIVE[recId] ||
    table.LIVE[upperId] ||
    (table.prefix
      ? table.LIVE[`${table.prefix}${recId}`] || table.LIVE[`${table.prefix}${upperId}`]
      : null) ||
    (table.prefix
      ? table.LIVE[recId.replace(new RegExp(`^${table.prefix}`, "i"), "")] ||
        table.LIVE[upperId.replace(new RegExp(`^${table.prefix}`, "i"), "")]
      : null);

  if (!rawRecord) {
    // 1. Core Banking Resolution for FORM.CONFIG (<MODEL>,<VERSION>)
    if (cmd === "FORM.CONFIG") {
      const parts = upperId.split(",");
      const modelKey = parts[0].trim();
      const versionKey = parts[1]?.trim() || "1.0.0";

      const model =
        SC_MODEL_CONFIG_LIVE[modelKey] ||
        SC_MODEL_CONFIG_LIVE[modelKey.replace(/\./g, "_")] ||
        SC_MODEL_CONFIG_LIVE[modelKey.replace(/_/g, ".")];

      if (!model) {
        return notFoundResult(
          `Target model '${modelKey}' does not exist in MODEL.CONFIG. Model must be defined first.`,
        );
      }

      // Model exists: Core pre-seeds a fresh Form Config version layout
      const formattedRecordId = parts.length > 1 ? `${modelKey},${versionKey}` : modelKey;
      const initialFormConfig = {
        recordId: formattedRecordId,
        id: formattedRecordId,
        title: `${modelKey} (${versionKey}) Form`,
        targetModel: modelKey,
        version: versionKey,
        description: `${versionKey} layout for ${modelKey}`,
        isActive: true,
        presentation: {
          archetype: "grid",
          density: "compact",
          steps: [],
          sections: [
            {
              id: "sec_main",
              title: model.description || modelKey,
              type: "standard",
              zone: "standard",
              columns: 2,
              collapsible: false,
              isCollapsed: false,
              layoutStyle: "card",
              fields: (model.properties || [])
                .filter((p) => p.status !== "ARCHIVED" && !p.sn.includes("_"))
                .map((p) => ({
                  id: `f_${p.name || p.sn}`,
                  fieldKey: p.name,
                  label: p.label || p.name,
                  widget: "text",
                  colSpan: 6,
                  required: Boolean(p.required),
                })),
            },
          ],
        },
      };

      return successResult(
        initialFormConfig,
        `Initialized new Form Config layout for ${modelKey},${versionKey}`,
      );
    }

    // 2. Core Banking Resolution for MODEL.CONFIG (<MODEL>)
    if (cmd === "MODEL.CONFIG") {
      const initialModel = {
        recordId: upperId,
        id: upperId,
        tableName: upperId,
        prefix: "",
        description: `${upperId} Model`,
        category: "CUSTOM",
        servicePath: "default",
        userDefineId: false,
        predefineId: false,
        access: "B",
        searchable: true,
        readOnly: false,
        authorize: true,
        associates: ["HIS", "UNA"],
        devBy: "",
        devDate: new Date().toISOString().split("T")[0],
        idDef: {
          idPrefix: "",
          idPattern: "",
          sequenceReset: false,
        },
        properties: [],
        isActive: true,
      };

      return successResult(initialModel, `Initialized new Model Config template for ${upperId}`);
    }

    // 3. Core Banking Resolution for INQUIRY.CONFIG (<INQUIRY_ID>)
    if (cmd === "INQUIRY.CONFIG") {
      const modelCandidate = upperId.startsWith("INQ.")
        ? upperId.replace(/^INQ\./, "")
        : upperId.startsWith("GET.")
          ? upperId.replace(/^GET\./, "").replace(/\.LIST$|\.INFO$/, "")
          : upperId;

      const model =
        SC_MODEL_CONFIG_LIVE[modelCandidate] ||
        SC_MODEL_CONFIG_LIVE[modelCandidate.replace(/\./g, "_")];

      const initialInquiry = {
        id: upperId,
        recordId: upperId,
        title: `${modelCandidate} Directory`,
        description: `Automated dynamic inquiry query for ${modelCandidate}`,
        pageOrientation: "Portrait",
        recordPerPage: 50,
        showSerial: true,
        showPagination: true,
        showBranchWise: false,
        inqServicePath: "default",
        inquiryType: "Data From Table",
        controllerName: modelCandidate,
        reportControlName: `RPT.${modelCandidate}`,
        cmdFromInternal: false,
        cmdFieldName: "recordId",
        fixedSelection: "",
        targetModel: model ? model.tableName || modelCandidate : modelCandidate,
        columns: model?.properties
          ? model.properties.slice(0, 8).map((p) => ({
              id: p.name,
              label: p.label || p.name,
              align: "left" as const,
              format:
                p.type === "Date"
                  ? ("date" as const)
                  : p.type === "Number" &&
                      (p.name.toLowerCase().includes("amount") ||
                        p.name.toLowerCase().includes("balance"))
                    ? ("currency" as const)
                    : p.type === "Number"
                      ? ("number" as const)
                      : ("text" as const),
              isMono: p.name.toUpperCase().includes("ID") || p.name.toUpperCase().includes("NO"),
              sortable: true,
              visible: true,
              isPinned: false,
            }))
          : [
              {
                id: "recordId",
                label: "ID / Ref",
                align: "left" as const,
                format: "text" as const,
                isMono: true,
                sortable: true,
                visible: true,
                isPinned: false,
              },
            ],
        filters: [],
        actions: [
          {
            id: "VIEW",
            label: "View",
            targetCommand: `${modelCandidate},SEE`,
            actionType: "view" as const,
            icon: "eye" as const,
            openMode: "tab" as const,
            idParamField: "recordId",
          },
        ],
        auditData: {
          recStatus: "INA",
          recCurrNumber: 1,
          recInputter: "SYSTEM",
          recInputTime: new Date().toISOString().replace("T", " ").slice(0, 19),
          recAuthorizer: "",
          recAuthTime: "",
          recBranchCode: "JB9999",
        },
      };

      return successResult(
        initialInquiry,
        `Initialized new Inquiry Config template for ${upperId}`,
      );
    }

    return notFoundResult(`Record #${recId} not found in database table ${cmd}`);
  }

  const recordWithId = {
    recordId: (rawRecord.recordId || rawRecord.id || recId) as string,
    id: (rawRecord.id || rawRecord.recordId || recId) as string,
    ...rawRecord,
  };

  return successResult(recordWithId, `${cmd} record loaded`);
}

/** Handles GNI (Get Next Sequence ID) */
export function handleNextId(payload: CbsWirePayload): ApiResponse {
  const clean = (payload.controlName || "").trim().toUpperCase();
  const model =
    SC_MODEL_CONFIG_LIVE[clean] ||
    SC_MODEL_CONFIG_LIVE[clean.replace(/\./g, "_")] ||
    SC_MODEL_CONFIG_LIVE[clean.replace(/_/g, ".")];

  const prefix =
    model?.idDef?.idPrefix ||
    (clean === "ACCOUNT" ? "AC" : clean === "CUSTOMER" ? "CU" : `${clean}.`);

  const generatedId = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
  return successResult(
    { recordId: generatedId, id: generatedId },
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

  return successResult(
    {
      recordId: targetId,
      id: targetId,
      ...(payload.data || {}),
      RECORD_STATUS: code,
    },
    `Record #${targetId} ${label} successfully in ${payload.controlName || "CBS"}`,
  );
}
