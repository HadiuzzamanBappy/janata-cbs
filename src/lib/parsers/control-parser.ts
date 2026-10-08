import { unwrapRecordsPayload } from "./protobuf-decoder";
import type { SystemCommandItem } from "@/lib/schemas";

/**
 * Universal parser to map raw CBS Protobuf control response to lean SystemCommandItem records.
 * Single source of truth: canonical control command + shorthand alias if recordId differs.
 */
export function parseControlsWirePayload(data: unknown): SystemCommandItem[] {
  const rawList = unwrapRecordsPayload<Record<string, unknown>>(data);
  const result: SystemCommandItem[] = [];

  for (const fields of rawList) {
    const recordId = String(fields.recordId || "");
    const controlName = String(fields.controlName || recordId);
    const desc = String(fields.description || controlName);

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

