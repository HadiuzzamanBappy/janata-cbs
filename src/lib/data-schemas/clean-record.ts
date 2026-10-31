import type { FormConfigRecord, FormElement, FormSection } from "./form-config-schema";
import type { INQDef, INQInfo, INQSelectField, InquiryConfigRecord } from "./inquiry-config-schema";
import type { ModelConfigRecord, ModelProperty } from "./model-config-schema";

/**
 * Sanitizes a FormElement for database persistence and wire JSON output:
 * - Removes client-only identifiers (`id: "f_..."`)
 * - Omits default falsy flags (`REQUIRED: false`, `DISABLED: false`)
 * - Omits empty text overrides (`DEFAULTVALUE: ""`, `ENRICHTEXT: ""`, `POSITION: ""`, `HELPTEXT: ""`, `FIXEDVALUE: ""`, `VALUE: ""`)
 * - Omits empty/default PARAMETER blocks if no options or model table are configured
 * - Omits type configuration blocks that are empty or inapplicable
 */
export function sanitizeFormElement(field: FormElement): FormElement {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _clientId, ...cleanField } = field as FormElement & { id?: string };

  const sanitized: Partial<FormElement> = {
    SN: String(cleanField.SN || "1"),
    NAME: cleanField.NAME,
    LABEL: cleanField.LABEL || cleanField.NAME,
    TYPE: cleanField.TYPE || "Text",
    STRUCTURE: cleanField.STRUCTURE || "S",
    LENGTH: cleanField.LENGTH ?? 35,
  };

  // Only keep presentation overrides if non-default
  if (cleanField.REQUIRED) sanitized.REQUIRED = true;
  if (cleanField.DISABLED) sanitized.DISABLED = true;
  if (cleanField.WIDTH && cleanField.WIDTH !== "md") sanitized.WIDTH = cleanField.WIDTH;
  if (cleanField.POSITION?.trim()) sanitized.POSITION = cleanField.POSITION.trim();
  if (cleanField.ENRICHTEXT?.trim()) sanitized.ENRICHTEXT = cleanField.ENRICHTEXT.trim();
  if (
    cleanField.DEFAULTVALUE !== undefined &&
    cleanField.DEFAULTVALUE !== null &&
    String(cleanField.DEFAULTVALUE).trim() !== ""
  ) {
    sanitized.DEFAULTVALUE = String(cleanField.DEFAULTVALUE).trim();
  }
  if (cleanField.HELPTEXT?.trim()) sanitized.HELPTEXT = cleanField.HELPTEXT.trim();
  if (cleanField.FIXEDVALUE?.trim()) sanitized.FIXEDVALUE = cleanField.FIXEDVALUE.trim();

  // Widget
  if (cleanField.WIDGET) sanitized.WIDGET = cleanField.WIDGET;

  // Parameter / Lookup
  const p = cleanField.PARAMETER;
  if (p) {
    if (p.type === "M" && p.modelName?.trim()) {
      const paramM: Record<string, unknown> = {
        type: "M",
        modelName: p.modelName.trim(),
      };
      if (p.reference?.trim()) paramM.reference = p.reference.trim();
      if (p.displayField?.trim()) paramM.displayField = p.displayField.trim();
      if (p.condition?.trim()) paramM.condition = p.condition.trim();
      if (p.codeField?.trim()) paramM.codeField = p.codeField.trim();
      sanitized.PARAMETER = paramM as typeof cleanField.PARAMETER;
    } else if ((p.type === "O" || !p.type) && Array.isArray(p.data) && p.data.length > 0) {
      sanitized.PARAMETER = {
        type: "O",
        data: p.data,
      } as typeof cleanField.PARAMETER;
    }
  }

  // Type configuration blocks (only if configured)
  if (
    cleanField.TEXT_CONFIG &&
    (cleanField.TEXT_CONFIG.maskPattern ||
      cleanField.TEXT_CONFIG.textTransform !== "uppercase" ||
      !cleanField.TEXT_CONFIG.autoTrim)
  ) {
    sanitized.TEXT_CONFIG = cleanField.TEXT_CONFIG;
  }
  if (
    cleanField.NUMBER_CONFIG &&
    (cleanField.NUMBER_CONFIG.isCurrency ||
      cleanField.NUMBER_CONFIG.currencyCode ||
      cleanField.NUMBER_CONFIG.decimals !== 2 ||
      cleanField.NUMBER_CONFIG.allowNegative)
  ) {
    sanitized.NUMBER_CONFIG = cleanField.NUMBER_CONFIG;
  }
  if (
    cleanField.DATE_CONFIG &&
    (cleanField.DATE_CONFIG.datePattern !== "YYYY-MM-DD" ||
      cleanField.DATE_CONFIG.minDateOffset ||
      cleanField.DATE_CONFIG.maxDateOffset ||
      cleanField.DATE_CONFIG.disableHolidays)
  ) {
    sanitized.DATE_CONFIG = cleanField.DATE_CONFIG;
  }
  if (
    cleanField.BOOLEAN_CONFIG &&
    (cleanField.BOOLEAN_CONFIG.widgetStyle !== "switch" ||
      cleanField.BOOLEAN_CONFIG.trueValue !== "Y" ||
      cleanField.BOOLEAN_CONFIG.falseValue !== "N")
  ) {
    sanitized.BOOLEAN_CONFIG = cleanField.BOOLEAN_CONFIG;
  }

  return sanitized as FormElement;
}

/**
 * Sanitizes a FormSection for sparse database persistence:
 * - Omits empty titles, descriptions, tabGroupIds
 * - Omits default false flags (collapsible: false, isCollapsed: false)
 * - Sanitizes all inner child fields
 */
export function sanitizeFormSection(section: FormSection): FormSection {
  const sanitized: Partial<FormSection> = {
    id: section.id,
    type: section.type || "standard",
    zone: section.zone || "standard",
    columns: section.columns || 1,
    layoutStyle: section.layoutStyle || "card",
  };

  if (section.title?.trim()) sanitized.title = section.title.trim();
  if (section.description?.trim()) sanitized.description = section.description.trim();
  if (section.tabGroupId?.trim()) sanitized.tabGroupId = section.tabGroupId.trim();
  if (section.tabTitle?.trim()) sanitized.tabTitle = section.tabTitle.trim();
  if (section.bindKey?.trim()) sanitized.bindKey = section.bindKey.trim();
  if (section.structure) sanitized.structure = section.structure;
  if (section.collapsible) sanitized.collapsible = true;
  if (section.isCollapsed) sanitized.isCollapsed = true;

  sanitized.fields = (section.fields || []).map(sanitizeFormElement);

  return sanitized as FormSection;
}

/**
 * Produces a clean, sparse FormConfigRecord ready for database wire persistence and JSON audit diffing.
 */
export function sanitizeFormConfigRecord(record?: FormConfigRecord): FormConfigRecord | undefined {
  if (!record) return undefined;

  const result: Partial<FormConfigRecord> = {};

  if (record.title?.trim()) result.title = record.title.trim();
  if (record.description?.trim()) result.description = record.description.trim();
  if (record.authNumber !== undefined && record.authNumber !== null)
    result.authNumber = record.authNumber;
  if (record.targetModel) result.targetModel = record.targetModel;
  if (record.auditData) result.auditData = record.auditData;

  // Routines: only keep if routines actually exist
  if (record.frmRoutine) {
    const rtnValidate = (record.frmRoutine.rtnValidate || []).filter((r) => r.routineName?.trim());
    const rtnBeforeAuth = (record.frmRoutine.rtnBeforeAuth || []).filter((r) =>
      r.routineName?.trim(),
    );
    const rtnAfterAuth = (record.frmRoutine.rtnAfterAuth || []).filter((r) =>
      r.routineName?.trim(),
    );

    if (rtnValidate.length > 0 || rtnBeforeAuth.length > 0 || rtnAfterAuth.length > 0) {
      result.frmRoutine = {
        rtnValidate,
        rtnBeforeAuth,
        rtnAfterAuth,
      };
    }
  }

  // Layout Elements
  if (record.frmElements) {
    const steps = (record.frmElements.steps || []).filter((s) => s.id && s.title);
    const sections = (record.frmElements.sections || []).map(sanitizeFormSection);

    result.frmElements = {
      ...(steps.length > 0 ? { steps } : { steps: [] }),
      sections,
    };
  }

  return result as FormConfigRecord;
}

/**
 * Sanitizes a ModelProperty in MODEL.CONFIG:
 * - Omits default false flags (REQUIRED: false)
 * - Omits default WIDTH ("md")
 */
export function sanitizeModelProperty(prop: ModelProperty): ModelProperty {
  const sanitized: Partial<ModelProperty> = {
    SN: String(prop.SN || ""),
    NAME: prop.NAME,
    LABEL: prop.LABEL || prop.NAME,
    TYPE: prop.TYPE || "Text",
    STRUCTURE: prop.STRUCTURE || "S",
    LENGTH: prop.LENGTH ?? 50,
  };

  if (prop.REQUIRED) sanitized.REQUIRED = true;
  if (prop.WIDTH && prop.WIDTH !== "md") sanitized.WIDTH = prop.WIDTH;

  return sanitized as ModelProperty;
}

/**
 * Sanitizes a ModelConfigRecord for sparse persistence:
 * - Cleans properties array
 * - Omits empty IDDEF properties
 * - Omits empty IDROUTINE, _DEVBY, _DEVDATE if unset
 */
export function sanitizeModelConfigRecord(
  record?: ModelConfigRecord,
): ModelConfigRecord | undefined {
  if (!record) return undefined;

  const result: Partial<ModelConfigRecord> = {
    TABLENAME: record.TABLENAME,
    DESCRIPTION: record.DESCRIPTION,
    ACCESS: record.ACCESS,
    SERVICEPATH: record.SERVICEPATH,
  };

  if (record.PREFIX?.trim()) result.PREFIX = record.PREFIX.trim();
  if (record.USERDEFINEID) result.USERDEFINEID = true;
  if (record.READONLY) result.READONLY = true;
  if (record.SEARCHABLE) result.SEARCHABLE = true;
  if (record.AUTHORIZE) result.AUTHORIZE = true;
  if (record.FIELDBASED) result.FIELDBASED = true;

  if (record.ASSOCIATES && record.ASSOCIATES.length > 0) {
    result.ASSOCIATES = record.ASSOCIATES;
  }

  if (record._DEVBY?.trim()) result._DEVBY = record._DEVBY.trim();
  if (record._DEVDATE?.trim()) result._DEVDATE = record._DEVDATE.trim();
  if (record.IDROUTINE?.trim()) result.IDROUTINE = record.IDROUTINE.trim();

  // IDDEF
  if (record.IDDEF) {
    const { IDPREFIX, SEQUENCELENGTH, SEQUENCERESET, IDPATTERN } = record.IDDEF;
    if (IDPREFIX?.trim() || SEQUENCELENGTH || SEQUENCERESET || IDPATTERN?.trim()) {
      result.IDDEF = {
        IDPREFIX: IDPREFIX || "",
        SEQUENCELENGTH: SEQUENCELENGTH || "",
        SEQUENCERESET: Boolean(SEQUENCERESET),
        IDPATTERN: IDPATTERN || "",
      };
    }
  }

  // PROPERTIES
  result.PROPERTIES = (record.PROPERTIES || []).map(sanitizeModelProperty);

  if (record.auditData) result.auditData = record.auditData;

  return result as ModelConfigRecord;
}

/**
 * Sanitizes an INQSelectField for sparse persistence:
 * - Omits empty prefill values
 * - Omits default false flags (selectFieldRequired: false)
 * - Omits empty fixed operator locks
 */
export function sanitizeInqSelectField(f: INQSelectField): INQSelectField {
  const result: Partial<INQSelectField> = {
    selectFieldName: f.selectFieldName,
    selectFieldDisplay: f.selectFieldDisplay || f.selectFieldName,
    selectFieldType: f.selectFieldType || "text",
    selectFieldOperator: f.selectFieldOperator || "EQ",
  };
  if (f.selectFieldValue?.trim()) result.selectFieldValue = f.selectFieldValue.trim();
  if (f.selectFieldRequired) result.selectFieldRequired = true;
  if (f.selectFieldOperatorFixed?.trim()) {
    result.selectFieldOperatorFixed = f.selectFieldOperatorFixed.trim();
  }
  return result as INQSelectField;
}

/**
 * Sanitizes an INQDef column definition:
 * - Omits empty routines
 * - Omits falsy/null passable flags
 */
export function sanitizeInqDef(col: INQDef): INQDef {
  const result: Partial<INQDef> = {
    fieldName: col.fieldName,
    fieldDisplay: col.fieldDisplay || col.fieldName,
    fieldType: col.fieldType || "CH",
    fieldLength: col.fieldLength || "20,L",
    fieldRowCol: col.fieldRowCol || "1,1",
  };
  if (col.fieldFunc?.trim()) result.fieldFunc = col.fieldFunc.trim();
  if (col.dataPassable) result.dataPassable = true;
  return result as INQDef;
}

/**
 * Sanitizes an InquiryConfigRecord for database persistence & wire JSON:
 * - Strips empty string overrides from INQInfo
 * - Cleans selection criteria and table columns arrays
 * - Preserves audit context
 */
export function sanitizeInquiryConfigRecord(
  record?: InquiryConfigRecord,
): InquiryConfigRecord | undefined {
  if (!record) return undefined;

  const inqInfo: Partial<INQInfo> = {
    controllerName: record.INQInfo?.controllerName || "",
    description: record.INQInfo?.description || "",
    inqServicePath: record.INQInfo?.inqServicePath || "default",
    inqType: record.INQInfo?.inqType || "DFT",
    pageOrientation: record.INQInfo?.pageOrientation || "Portrait",
    perpageItem: record.INQInfo?.perpageItem || "30",
  };

  if (record.INQInfo?.showSerial) inqInfo.showSerial = true;
  if (record.INQInfo?.showPagination) inqInfo.showPagination = true;
  if (record.INQInfo?.showBranchWise) inqInfo.showBranchWise = true;
  if (record.INQInfo?.fixedSelection?.trim()) {
    inqInfo.fixedSelection = record.INQInfo.fixedSelection.trim();
  }
  if (record.INQInfo?.rptControllerName?.trim()) {
    inqInfo.rptControllerName = record.INQInfo.rptControllerName.trim();
  }
  if (record.INQInfo?.cmdFromInternal) inqInfo.cmdFromInternal = record.INQInfo.cmdFromInternal;
  if (record.INQInfo?.cmdFieldName?.trim()) {
    inqInfo.cmdFieldName = record.INQInfo.cmdFieldName.trim();
  }

  const result: Partial<InquiryConfigRecord> = {
    INQInfo: inqInfo as INQInfo,
    INQSelectField: (record.INQSelectField || []).map(sanitizeInqSelectField),
    INQDef: (record.INQDef || []).map(sanitizeInqDef),
    INQCmds: (record.INQCmds || []).map((cmd) => ({
      cmdButton: cmd.cmdButton,
      cmdFor: cmd.cmdFor,
    })),
  };

  if (record.auditData) result.auditData = record.auditData;

  return result as InquiryConfigRecord;
}
