import type { z } from "zod";
import { SERVICE_NAME_PATTERN } from "./common-schema";
import {
  CBS_PROPERTY_TYPE,
  FIXED_PROPERTY_LENGTHS,
  type ModelConfigRecord,
  type ModelProperty,
  modelConfigRecordSchema,
  PROPERTY_TYPES,
  type PropertyType,
  resolvePhysicalLength,
  resolvePhysicalStructure,
} from "./model-config-schema";

/* ========================================================================== */
/* SAVE RULES (PUT): what may be written to MODEL.CONFIG                      */
/* ========================================================================== */

const TABLE_NAME_PATTERN = /^[A-Z][A-Z0-9_.]*$/;
const MODEL_ACCESS_CODES: readonly string[] = ["G", "B"];
const MODEL_NAME_PATTERN = /^[A-Z0-9_.]+$/;

const isPositiveInteger = (v: unknown): boolean => Number.isInteger(Number(v)) && Number(v) > 0;

/**
 * Save rules of a property list (top-level columns, or an Array's sub-properties): unique names,
 * a positive length on variable-length columns, a well-formed MODELNAME (String/Number only),
 * at least one sub-property on Array, no PROP on non-Array, and no nested Array.
 */
function checkProperties(
  props: ModelProperty[],
  basePath: (string | number)[],
  ctx: z.RefinementCtx,
  parentName?: string,
): void {
  const seen = new Set<string>();
  props.forEach((prop, idx) => {
    const path = [...basePath, idx];
    const label = prop.NAME || `#${prop.SN}`;
    const issue = (key: string, message: string) =>
      ctx.addIssue({ code: "custom", message, path: [...path, key] });

    const lower = (prop.NAME || "").trim().toLowerCase();
    if (lower && seen.has(lower)) {
      issue(
        "NAME",
        parentName
          ? `Duplicate sub-property name "${prop.NAME}" in "${parentName}".`
          : `Duplicate column name "${prop.NAME}". Each property must have a unique name.`,
      );
    }
    seen.add(lower);

    if (FIXED_PROPERTY_LENGTHS[prop.TYPE] === undefined && !isPositiveInteger(prop.LENGTH)) {
      issue("LENGTH", `Property "${label}" needs a length greater than 0.`);
    }

    const modelName = (prop.MODELNAME || "").trim();
    if (modelName) {
      if (prop.TYPE !== CBS_PROPERTY_TYPE.STRING && prop.TYPE !== CBS_PROPERTY_TYPE.NUMBER) {
        issue(
          "MODELNAME",
          `Property "${label}" cannot define MODELNAME. MODELNAME is supported only on String and Number properties.`,
        );
      } else if (!MODEL_NAME_PATTERN.test(modelName)) {
        issue(
          "MODELNAME",
          `Property "${label}" has invalid MODELNAME "${modelName}". Use uppercase letters, digits, dots or underscores.`,
        );
      }
    }

    if (parentName && prop.TYPE === CBS_PROPERTY_TYPE.ARRAY) {
      issue(
        "TYPE",
        `Sub-property "${label}" cannot be of type Array. Nested arrays are not supported.`,
      );
    }

    if (!parentName) {
      const hasSubProps = Boolean(prop.PROP?.length);
      if (prop.TYPE === CBS_PROPERTY_TYPE.ARRAY && !hasSubProps) {
        issue("PROP", `Array property "${label}" must define at least one sub-property.`);
      } else if (prop.TYPE !== CBS_PROPERTY_TYPE.ARRAY && hasSubProps) {
        issue("PROP", `Property "${label}" of type ${prop.TYPE} cannot have sub-properties.`);
      } else if (prop.TYPE === CBS_PROPERTY_TYPE.ARRAY && prop.PROP?.length) {
        checkProperties(prop.PROP, [...path, "PROP"], ctx, prop.NAME || `#${prop.SN}`);
      }
    }
  });
}

/**
 * The record schema plus the rules a save must meet. Reads (GET, GFC) and browser drafts stay on
 * `modelConfigRecordSchema`, so a stored model that predates a rule still loads.
 * Used by the MODEL.CONFIG screen before saving and by `/api/proxy` on every PUT to MODEL.CONFIG.
 */
export const modelConfigSaveSchema = modelConfigRecordSchema.superRefine((data, ctx) => {
  if (!TABLE_NAME_PATTERN.test(data.TABLENAME)) {
    ctx.addIssue({
      code: "custom",
      message:
        "Table Name must be uppercase letters, digits, dots or underscores (e.g. ACCOUNT, USER.MGT).",
      path: ["TABLENAME"],
    });
  }
  if (!MODEL_ACCESS_CODES.includes(data.ACCESS)) {
    ctx.addIssue({
      code: "custom",
      message: "Table Type must be G (Global) or B (Branch).",
      path: ["ACCESS"],
    });
  }
  if (!SERVICE_NAME_PATTERN.test(data.SERVICEPATH)) {
    ctx.addIssue({
      code: "custom",
      message: "Service Path must be a service name: letters and digits (e.g. default, finxurm).",
      path: ["SERVICEPATH"],
    });
  }
  // The wire `authLevel` is 0-9, so a higher level could never be authorized
  if (!Number.isInteger(data.AUTHLEVEL) || data.AUTHLEVEL < 0 || data.AUTHLEVEL > 9) {
    ctx.addIssue({
      code: "custom",
      message: "Authorization Level must be a whole number from 0 to 9 (0 = no authorization).",
      path: ["AUTHLEVEL"],
    });
  }
  const sequenceLength = data.IDDEF.SEQUENCELENGTH;
  if (sequenceLength !== undefined && sequenceLength !== "" && !isPositiveInteger(sequenceLength)) {
    ctx.addIssue({
      code: "custom",
      message: "Sequence Length must be a whole number greater than 0.",
      path: ["IDDEF", "SEQUENCELENGTH"],
    });
  }
  if (data.PROPERTIES.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "At least one column/property must be configured in the data dictionary.",
      path: ["PROPERTIES"],
    });
  }
  checkProperties(data.PROPERTIES, ["PROPERTIES"], ctx);
});

/* ========================================================================== */
/* SAVED-MODEL RULES: what a save may not change once the table exists        */
/* ========================================================================== */

/** One way a save would break the stored table; `path` is the form path, as a Zod issue's. */
export interface SavedModelIssue {
  readonly path: (string | number)[];
  readonly message: string;
}

const sameText = (a: unknown, b: unknown): boolean =>
  String(a ?? "")
    .trim()
    .toUpperCase() ===
  String(b ?? "")
    .trim()
    .toUpperCase();

/** A column as the database sees it, normalized the way `sanitizeModelConfigRecord` writes it. */
function physicalColumn(prop: ModelProperty) {
  const type: PropertyType = PROPERTY_TYPES.includes(prop.TYPE)
    ? prop.TYPE
    : CBS_PROPERTY_TYPE.STRING;
  const canLinkModel = type === CBS_PROPERTY_TYPE.STRING || type === CBS_PROPERTY_TYPE.NUMBER;
  return {
    type,
    structure: resolvePhysicalStructure(type, prop.STRUCTURE),
    length: resolvePhysicalLength(type, prop.LENGTH),
    modelName: canLinkModel
      ? String(prop.MODELNAME ?? "")
          .trim()
          .toUpperCase()
      : "",
    required: Boolean(prop.REQUIRED),
  };
}

/** Columns are matched by name (case-insensitive), which is what the stored table knows them by. */
function checkSavedColumns(
  next: readonly ModelProperty[],
  saved: readonly ModelProperty[],
  basePath: (string | number)[],
  issues: SavedModelIssue[],
): void {
  const byName = new Map(
    next.map((prop, idx) => [
      String(prop.NAME ?? "")
        .trim()
        .toUpperCase(),
      idx,
    ]),
  );
  for (const old of saved) {
    const name = String(old.NAME ?? "").trim();
    if (!name) continue;
    const idx = byName.get(name.toUpperCase());
    if (idx === undefined) {
      issues.push({
        path: basePath,
        message: `Saved column "${name}" can't be removed or renamed.`,
      });
      continue;
    }
    const add = (key: string, message: string) =>
      issues.push({ path: [...basePath, idx, key], message });
    const was = physicalColumn(old);
    const now = physicalColumn(next[idx]);

    if (now.type !== was.type) {
      add("TYPE", `Saved column "${name}" can't change type (saved as ${was.type}).`);
      continue;
    }
    if (now.structure !== was.structure) {
      add(
        "STRUCTURE",
        `Saved column "${name}" can't change structure (saved as ${was.structure}).`,
      );
    }
    if (now.length < was.length) {
      add("LENGTH", `Length of "${name}" can't be shorter than the saved ${was.length}.`);
    }
    if (now.modelName !== was.modelName) {
      add(
        "MODELNAME",
        `Saved column "${name}" can't change its linked model (saved as "${was.modelName}").`,
      );
    }
    if (now.required && !was.required) {
      add(
        "REQUIRED",
        `Saved optional column "${name}" can't become required: stored rows may be empty.`,
      );
    }
    if (now.type === CBS_PROPERTY_TYPE.ARRAY) {
      checkSavedColumns(next[idx].PROP ?? [], old.PROP ?? [], [...basePath, idx, "PROP"], issues);
    }
  }
}

/**
 * Rules a save must keep against the model already stored, because the table and its rows depend
 * on it: the table name and prefix stay, and every saved column (and sub-column) stays with the
 * same name, type, structure and linked model, a length that only grows, and no new "required".
 * The screen checks it against the record it loaded; `/api/proxy` against the live model.
 */
export function savedModelIssues(
  next: ModelConfigRecord,
  saved: ModelConfigRecord,
): SavedModelIssue[] {
  const issues: SavedModelIssue[] = [];
  if (!sameText(next.TABLENAME, saved.TABLENAME)) {
    issues.push({
      path: ["TABLENAME"],
      message: `Table Name can't change once created (saved as ${saved.TABLENAME}).`,
    });
  }
  if (!sameText(next.PREFIX, saved.PREFIX)) {
    issues.push({
      path: ["PREFIX"],
      message: `Table Prefix can't change once created (saved as "${saved.PREFIX ?? ""}").`,
    });
  }
  checkSavedColumns(next.PROPERTIES ?? [], saved.PROPERTIES ?? [], ["PROPERTIES"], issues);
  return issues;
}
