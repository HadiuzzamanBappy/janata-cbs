import type {
  ModelConfigRecord,
  ModelProperty,
  PropertyType,
} from "@/features/system/model-config/types";
import { type RawModelProperty, rawModelConfigSchema } from "@/lib/schemas/model-config-schema";

function normalizePropertyType(rawType?: string): PropertyType {
  const t = (rawType || "").toLowerCase();
  if (t === "text" || t === "varchar" || t === "string") return "Text";
  if (t === "number" || t === "numeric" || t === "decimal" || t === "int") return "Number";
  if (t === "date" || t === "time" || t === "datetime") return "Date";
  if (t === "boolean" || t === "bool") return "Boolean";
  if (t === "dropdown" || t === "select") return "Dropdown";
  if (t === "checkbox") return "Checkbox";
  if (t === "radio") return "Radio";
  if (t === "textarea") return "Textarea";
  if (t === "object") return "Object";
  if (t === "array" || t === "list") return "Array";
  return "Text";
}

function parseModelProperty(raw: RawModelProperty, idx: number): ModelProperty {
  const sn = raw.SN !== undefined ? String(raw.SN) : String(idx + 1);
  const lengthNum = typeof raw.LENGTH === "string" ? Number.parseFloat(raw.LENGTH) : (raw.LENGTH ?? 50);
  const widthNum = typeof raw.WIDTH === "string" ? Number.parseFloat(raw.WIDTH) : (raw.WIDTH ?? 200);

  // Parse options from PARAMETER or DATASOURCE if present
  let options: string[] = [];
  if (Array.isArray(raw.DATASOURCE) && raw.DATASOURCE.length > 0) {
    options = raw.DATASOURCE;
  } else if (raw.PARAMETER && typeof raw.PARAMETER === "object" && Array.isArray(raw.PARAMETER.data)) {
    options = raw.PARAMETER.data.map(
      (item: { itemLabel?: string; itemCode?: string }) =>
        item.itemLabel || item.itemCode || JSON.stringify(item),
    );
  }

  // Parse children if any
  let children: ModelProperty[] = [];
  if (Array.isArray(raw.PROP) && raw.PROP.length > 0) {
    children = raw.PROP.map((child, cIdx) => parseModelProperty(child, cIdx));
  }

  return {
    sn,
    name: raw.NAME || `FIELD_${idx + 1}`,
    label: raw.LABEL || raw.NAME || `Field ${idx + 1}`,
    type: normalizePropertyType(raw.TYPE),
    structure: (raw.STRUCTURE as "S" | "M") || "S",
    length: Number.isNaN(lengthNum) ? 50 : lengthNum,
    required: raw.REQUIRED === true || raw.REQUIRED === "true" || raw.REQUIRED === "Y",
    disabled: raw.DISABLED === true || raw.DISABLED === "true",
    width: Number.isNaN(widthNum) ? 200 : widthNum,
    defaultValue: raw.VALUE,
    enrichText: raw.ENRICHTEXT || undefined,
    options,
    children,
  };
}

export function parseModelConfig(
  rawPayload: unknown,
): { success: true; data: ModelConfigRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Model config payload is invalid" };
  }

  const parseResult = rawModelConfigSchema.safeParse(rawPayload);
  if (!parseResult.success) {
    return {
      success: false,
      error: `ModelConfig validation failed: ${parseResult.error.message}`,
    };
  }

  const raw = parseResult.data;
  const properties = (raw.PROPERTIES || []).map((p, idx) => parseModelProperty(p, idx));

  return {
    success: true,
    data: {
      recordId: raw.TABLENAME,
      description: raw.DESCRIPTION || raw.TABLENAME,
      tableName: raw.TABLENAME,
      prefix: raw.PREFIX || "SC",
      category: raw.PREFIX === "SC" ? "SYSTEM" : "APPLICATION",
      servicePath: raw.SERVICEPATH || "default",
      userDefineId: Boolean(raw.USERDEFINEID),
      predefineId: Boolean(raw.PREDIFINEID),
      access: raw.ACCESS || "G",
      searchable: raw.SEARCHABLE ?? true,
      readOnly: Boolean(raw.READONLY),
      authorize: Boolean(raw.AUTHORIZE),
      associates: raw.ASSOCIATES || [],
      devBy: raw._DEVBY || "",
      devDate: raw._DEVDATE || "",
      idDef: {
        idPrefix: raw.IDDEF?.IDPREFIX || "",
        idPattern: raw.IDDEF?.IDPATTERN || "",
        sequenceLength: raw.IDDEF?.SEQUENCELENGTH,
        sequenceReset: Boolean(raw.IDDEF?.SEQUENCERESET),
      },
      properties,
      isActive: true,
      auditData: raw.auditData
        ? {
            recStatus: raw.auditData.recStatus,
            recCurrNumber:
              typeof raw.auditData.recCurrNumber === "string"
                ? Number.parseInt(raw.auditData.recCurrNumber, 10)
                : raw.auditData.recCurrNumber,
            recInputter: raw.auditData.recInputter,
            recInputTime: raw.auditData.recInputTime,
            recAuthorizer: raw.auditData.recAuthorizer,
            recAuthTime: raw.auditData.recAuthTime,
            recBranchCode: raw.auditData.recBranchCode,
          }
        : undefined,
    },
  };
}
