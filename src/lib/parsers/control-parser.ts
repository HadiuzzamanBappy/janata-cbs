import { extractStringField, getItemFields, unwrapRecordsPayload } from "@/lib/grpc/struct";
import type { SystemCommandItem } from "@/lib/schemas";

/**
 * Universal parser to map raw CBS Protobuf control response to SystemCommandItem records.
 * Executed identically for both live gRPC and static mock modes.
 */
export function parseControlsWirePayload(data: unknown): SystemCommandItem[] {
  const rawList = unwrapRecordsPayload(data);
  const result: SystemCommandItem[] = [];

  for (const item of rawList) {
    const fields = getItemFields(item);
    const recordId = extractStringField(fields, "recordId");
    const controlName = extractStringField(fields, "controlName") || recordId;
    const desc = extractStringField(fields, "description") || controlName;

    // Primary entry for the canonical controlName
    if (controlName) {
      result.push({
        id: controlName,
        title: desc,
        category: "System Controls & Commands",
        description: desc,
        command: controlName,
        controlName,
        recordId: recordId || controlName,
        allowedRoles: ["*"],
        actionType: "SCREEN",
      });
    }

    // Secondary alias entry if recordId differs (e.g., AE -> ACCOUNT.ENTRY, CMD -> SC.CONTROL.LIST)
    if (recordId && recordId !== controlName) {
      result.push({
        id: recordId,
        title: `${desc} [${recordId}]`,
        category: "System Controls & Commands",
        description: `Alias for ${controlName}`,
        command: recordId,
        componentName: controlName, // Routes to canonical target
        controlName,
        recordId,
        allowedRoles: ["*"],
        actionType: "SCREEN",
      });
    }
  }

  return result;
}
