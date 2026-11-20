import {
  type FormConfigRecord,
  formConfigRecordSchema,
  gfcResponseSchema,
  type ModelConfigRecord,
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
 */
export function parseGfcResponse(
  rawPayload: unknown,
): { success: true; data: ParsedGfcResponse } | { success: false; error: string } {
  const target = extractModelConfigRecord(rawPayload);
  if (!target) {
    return { success: false, error: "GFC payload record is empty or invalid" };
  }

  const parsed = gfcResponseSchema.safeParse(target);
  let modelRaw: Record<string, unknown>;
  let rawFc: Record<string, unknown> | undefined;

  if (parsed.success) {
    const { FORMCONTROL, ...rest } = parsed.data;
    modelRaw = rest as Record<string, unknown>;
    rawFc = FORMCONTROL as Record<string, unknown> | undefined;
  } else {
    // Resilient fallback: extract FORMCONTROL and model fields defensively
    // so properties palette is never dropped due to non-fatal schema mismatch
    const { FORMCONTROL, ...rest } = target;
    modelRaw = rest;
    rawFc = (FORMCONTROL && typeof FORMCONTROL === "object" ? FORMCONTROL : {}) as Record<
      string,
      unknown
    >;
  }

  const hasExistingLayout = Boolean(
    rawFc && Object.keys(rawFc).length > 0 && (rawFc.frmElements || rawFc.title),
  );

  let form: FormConfigRecord | null = null;
  if (hasExistingLayout && rawFc) {
    const formParsed = formConfigRecordSchema.safeParse(rawFc);
    if (formParsed.success) {
      form = sanitizeFormConfigRecord(formParsed.data);
    }
  }

  const model = sanitizeModelConfigRecord(modelRaw as ModelConfigRecord);

  return {
    success: true,
    data: {
      model,
      form,
      // A stored layout that fails to parse is not new: treating it as new would let a blank draft overwrite it
      isNew: !hasExistingLayout,
    },
  };
}
