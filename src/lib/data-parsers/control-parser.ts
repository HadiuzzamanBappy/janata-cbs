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
    const rawAny = fields as Record<string, unknown>;
    const command = String(fields.command || rawAny.controlName || rawAny.recordId || "").trim();
    if (!command) continue;

    const title = String(fields.title || rawAny.description || command).trim();
    const aliases = Array.isArray(fields.aliases) ? fields.aliases : [];
    const actionType = fields.actionType || "SCREEN";

    result.push({
      command,
      title,
      aliases,
      actionType,
    });
  }

  return result;
}
