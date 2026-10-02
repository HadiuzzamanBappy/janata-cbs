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
    const cmdName =
      extractStringField(fields, "controlName") || extractStringField(fields, "recordId");
    const desc = extractStringField(fields, "description") || cmdName;

    if (cmdName) {
      result.push({
        id: cmdName,
        title: desc || cmdName,
        category: "System Controls & Commands",
        description: desc,
        command: cmdName,
        allowedRoles: ["*"],
        actionType: "SCREEN",
      });
    }
  }

  return result;
}
