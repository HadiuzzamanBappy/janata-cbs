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
  /** Parts of a stored layout dropped because they failed the read schema (empty when clean). */
  repairs: string[];
}

/** Upper bound on repair passes: each pass drops one invalid part. */
const MAX_LAYOUT_REPAIRS = 200;

/**
 * Removes the part at `path` from a JSON tree: an array item is spliced, an object key deleted.
 * A path to a missing value (a required key that isn't there) removes the object that lacks it.
 */
function dropAtPath(root: Record<string, unknown>, path: readonly PropertyKey[]): string | null {
  if (path.length === 0) return null;
  let parent: unknown = root;
  for (const key of path.slice(0, -1)) {
    parent = (parent as Record<PropertyKey, unknown> | undefined)?.[key];
  }
  const last = path[path.length - 1];
  const container = parent as Record<PropertyKey, unknown> | unknown[] | undefined;
  if (!container || typeof container !== "object" || container[last as never] === undefined) {
    return dropAtPath(root, path.slice(0, -1));
  }
  if (Array.isArray(container) && typeof last === "number") container.splice(last, 1);
  else delete (container as Record<PropertyKey, unknown>)[last];
  return path.map(String).join(".");
}

/**
 * Reads a stored layout leniently, so a layout that predates a rule (or was damaged) can still be
 * opened and repaired: each part that fails `formConfigRecordSchema` is dropped (the leaf when it
 * holds a bad value, its owner when a required key is missing) and named in `repairs`. The save
 * rules stay strict, so what is saved again is clean.
 */
function readStoredLayout(
  layout: Record<string, unknown>,
): { form: FormConfigRecord; repairs: string[] } | null {
  const working = structuredClone(layout);
  const repairs: string[] = [];
  for (let pass = 0; pass <= MAX_LAYOUT_REPAIRS; pass++) {
    const parsed = formConfigRecordSchema.safeParse(working);
    if (parsed.success) return { form: sanitizeFormConfigRecord(parsed.data), repairs };
    const issue = parsed.error.issues[0];
    const dropped = dropAtPath(working, issue.path);
    if (!dropped) return null;
    const at = issue.path.map(String).join(".");
    repairs.push(`${dropped}: ${issue.message}${at === dropped ? "" : ` (at ${at})`}`);
  }
  return null;
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

  // Any stored layout counts, even one holding only a description or routines: treating it as new
  // would let a blank draft overwrite it
  const layout =
    rawFc && typeof rawFc === "object" && !Array.isArray(rawFc)
      ? (rawFc as Record<string, unknown>)
      : undefined;
  const hasExistingLayout = Boolean(layout && Object.keys(layout).length > 0);
  const stored = layout && hasExistingLayout ? readStoredLayout(layout) : null;

  return {
    success: true,
    data: {
      model: sanitizeModelConfigRecord(modelResult.data),
      form: stored?.form ?? null,
      isNew: !hasExistingLayout,
      repairs: stored?.repairs ?? [],
    },
  };
}
