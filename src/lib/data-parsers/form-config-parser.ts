import {
  type FormConfigRecord,
  formConfigRecordSchema,
  type ModelConfigRecord,
  modelConfigRecordSchema,
} from "@/lib/data-schemas";
import { sanitizeFormConfigRecord } from "./form-config-serializer";
import { extractModelConfigRecord, sanitizeModelConfigRecord } from "./model-config-parser";

/* -------------------------------------------------------------------------- */
/* Combined GFC Response Parser                                                */
/* -------------------------------------------------------------------------- */

export interface ParsedGfcResponse {
  model: ModelConfigRecord;
  form: FormConfigRecord | null;
  isNew: boolean;
}

/**
 * Parses combined GFC wire response containing physical ModelConfigRecord
 * and presentation FORMCONTROL layout into clean, normalized domain structures.
 * Each half is validated with its own schema.
 */
export function parseGfcResponse(
  rawPayload: unknown,
): { success: true; data: ParsedGfcResponse } | { success: false; error: string } {
  const target = extractModelConfigRecord(rawPayload);
  if (!target) {
    return { success: false, error: "GFC payload record is empty or invalid" };
  }

  const { FORMCONTROL: rawFc, ...modelRaw } = target;

  // A model missing a required header (DESCRIPTION, SERVICEPATH...) must still feed the
  // palette: the partial schema validates what is present and the sanitizer fills the rest.
  const modelParsed = modelConfigRecordSchema.safeParse(modelRaw);
  const modelResult = modelParsed.success
    ? modelParsed
    : modelConfigRecordSchema.partial().safeParse(modelRaw);
  if (!modelResult.success) {
    return { success: false, error: "GFC model record is invalid" };
  }

  const layout =
    rawFc && typeof rawFc === "object" ? (rawFc as Record<string, unknown>) : undefined;
  const hasExistingLayout = Boolean(layout?.frmElements || layout?.title);

  let form: FormConfigRecord | null = null;
  if (hasExistingLayout) {
    const formParsed = formConfigRecordSchema.safeParse(layout);
    if (formParsed.success) {
      form = sanitizeFormConfigRecord(formParsed.data);
    }
  }

  return {
    success: true,
    data: {
      model: sanitizeModelConfigRecord(modelResult.data),
      form,
      // A stored layout that fails to parse is not new: treating it as new would let a blank draft overwrite it
      isNew: !hasExistingLayout,
    },
  };
}
