import { z } from "zod";
import {
  type FormConfigRecord,
  formConfigRecordSchema,
} from "@/lib/data-schemas/form-config-schema";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Single Record Parser                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Parses inbound JSON / Protobuf payload into a strictly validated FormConfigRecord.
 */
export function parseFormConfig(
  rawPayload: unknown,
): { success: true; data: FormConfigRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Form config payload is invalid" };
  }

  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const list = unwrapRecordsPayload(decoded);
  const target = list[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded);

  if (!target || typeof target !== "object") {
    return { success: false, error: "Form config record is empty or invalid" };
  }

  const parseResult = formConfigRecordSchema.safeParse(target);
  if (!parseResult.success) {
    return {
      success: false,
      error: `FormConfig validation failed: ${parseResult.error.message}`,
    };
  }

  return {
    success: true,
    data: parseResult.data,
  };
}

/* -------------------------------------------------------------------------- */
/* List Parser                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Parses a list of form config records from CBS backend wire responses.
 */
export function parseFormConfigList(
  rawPayload: unknown,
): { success: true; data: FormConfigRecord[] } | { success: false; error: string } {
  if (!rawPayload) {
    return { success: true, data: [] };
  }

  const rawList = unwrapRecordsPayload(rawPayload);
  const parseResult = z.array(formConfigRecordSchema).safeParse(rawList);

  if (!parseResult.success) {
    return {
      success: false,
      error: `Form config list validation failed: ${parseResult.error.message}`,
    };
  }

  return {
    success: true,
    data: parseResult.data,
  };
}
