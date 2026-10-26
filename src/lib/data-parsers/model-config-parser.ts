import { z } from "zod";
import {
  type ModelConfigRecord,
  type ModelProperty,
  modelConfigRecordSchema,
} from "@/lib/data-schemas/model-config-schema";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Single Record Parser                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Parses inbound JSON payload into a strictly validated ModelConfigRecord.
 */
export function parseModelConfig(
  rawPayload: unknown,
): { success: true; data: ModelConfigRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Model config payload is invalid" };
  }

  const decoded = decodeProtobufValue<Record<string, unknown>>(rawPayload);
  const list = unwrapRecordsPayload(decoded);
  const target = list[0] ?? (Array.isArray(decoded) ? decoded[0] : decoded);

  const parseResult = modelConfigRecordSchema.safeParse(target);
  if (!parseResult.success) {
    return {
      success: false,
      error: `ModelConfig validation failed: ${parseResult.error.message}`,
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
 * Parses a list of model config records from CBS backend wire responses.
 */
export function parseModelConfigList(
  rawPayload: unknown,
): { success: true; data: ModelConfigRecord[] } | { success: false; error: string } {
  if (!rawPayload) {
    return { success: true, data: [] };
  }

  const rawList = unwrapRecordsPayload(rawPayload);
  const parseResult = z.array(modelConfigRecordSchema).safeParse(rawList);

  if (!parseResult.success) {
    return {
      success: false,
      error: `Model config list validation failed: ${parseResult.error.message}`,
    };
  }

  return {
    success: true,
    data: parseResult.data,
  };
}

/* -------------------------------------------------------------------------- */
/* Tree Transformation Utilities (PROP Nesting)                              */
/* -------------------------------------------------------------------------- */

/**
 * Recursively flattens a nested ModelProperty tree (with PROP: [...]) into a flat array.
 */
export function flattenModelProperties(props: ModelProperty[]): ModelProperty[] {
  const result: ModelProperty[] = [];
  for (const p of props) {
    result.push(p);
    if (Array.isArray(p.PROP) && p.PROP.length > 0) {
      result.push(...flattenModelProperties(p.PROP));
    }
  }
  return result;
}
