import { extractStringField, getItemFields, unwrapRecordsPayload } from "@/lib/grpc/struct";
import type { SystemCommandItem } from "@/lib/schemas";

/**
 * Universal parser to map raw CBS Protobuf control response to lean SystemCommandItem records.
 * Single source of truth: canonical control command + shorthand alias if recordId differs.
 */
export function parseControlsWirePayload(data: unknown): SystemCommandItem[] {
  const rawList = unwrapRecordsPayload(data);
  const result: SystemCommandItem[] = [];

  for (const item of rawList) {
    const fields = getItemFields(item);
    const recordId = extractStringField(fields, "recordId");
    const controlName = extractStringField(fields, "controlName") || recordId;
    const desc = extractStringField(fields, "description") || controlName;

    if (controlName) {
      const aliases = recordId && recordId !== controlName ? [recordId] : [];
      result.push({
        id: controlName,
        title: desc,
        category: "System Controls & Commands",
        command: controlName,
        aliases,
        actionType: "SCREEN",
      });
    }
  }

  return result;
}
