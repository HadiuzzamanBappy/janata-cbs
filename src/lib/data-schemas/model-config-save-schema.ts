import type { z } from "zod";
import { SERVICE_NAME_PATTERN } from "./common-schema";
import {
  CBS_PROPERTY_TYPE,
  FIXED_PROPERTY_LENGTHS,
  type ModelProperty,
  modelConfigRecordSchema,
} from "./model-config-schema";

/* ========================================================================== */
/* SAVE RULES (SMC): what may be written to MODEL.CONFIG                      */
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
 * The record schema plus the rules a save must meet. Reads (GMC, GFC) and browser drafts stay on
 * `modelConfigRecordSchema`, so a stored model that predates a rule still loads.
 * Used by the MODEL.CONFIG screen before saving and by `/api/proxy` on every SMC.
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
  if (!Number.isInteger(data.AUTHLEVEL) || data.AUTHLEVEL < 0) {
    ctx.addIssue({
      code: "custom",
      message: "Authorization Level must be a whole number of 0 or more (0 = no authorization).",
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
