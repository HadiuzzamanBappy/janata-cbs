import { type ModelConfigRecord, modelConfigRecordSchema } from "@/lib/schemas/model-config-schema";

/**
 * Parses inbound JSON payload into a strictly validated ModelConfigRecord.
 * With clean 1:1 database storage, this executes direct schema validation without manual field mapping.
 */
export function parseModelConfig(
  rawPayload: unknown,
): { success: true; data: ModelConfigRecord } | { success: false; error: string } {
  if (!rawPayload || typeof rawPayload !== "object") {
    return { success: false, error: "Model config payload is invalid" };
  }

  const parseResult = modelConfigRecordSchema.safeParse(rawPayload);
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

/**
 * Serializes internal ModelConfigRecord for database storage or JSON preview.
 * Direct 1:1 canonical format. Safely handles in-progress draft models by falling back
 * gracefully instead of throwing runtime exceptions during live typing.
 */
export function serializeModelToWireJson(record: ModelConfigRecord): ModelConfigRecord {
  const result = modelConfigRecordSchema.safeParse(record);
  if (result.success) {
    return result.data;
  }
  // During live editing (e.g. freshly added field without name/label yet),
  // return the raw draft record sanitized for live preview
  return record;
}
