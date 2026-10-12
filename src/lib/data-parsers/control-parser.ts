import type { RawControlRecord, SystemCommandItem } from "@/lib/data-schemas";
import { unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Wire Parser API                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Universal parser to map raw CBS Protobuf control response to lean SystemCommandItem records.
 * Purely extracts database wire fields without artificial mock defaults.
 */
export function parseControlsWirePayload(data: unknown): SystemCommandItem[] {
  const rawList = unwrapRecordsPayload<RawControlRecord>(data);
  const result: SystemCommandItem[] = [];

  for (const fields of rawList) {
    const recordId = fields.recordId ? String(fields.recordId).trim() : "";
    const controlName = fields.controlName ? String(fields.controlName).trim() : recordId;
    const desc = fields.description ? String(fields.description).trim() : controlName;

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
