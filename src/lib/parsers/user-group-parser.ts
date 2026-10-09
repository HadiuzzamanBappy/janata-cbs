import { type UserGroupRecord, userGroupRecordSchema } from "@/lib/schemas/user-group-schema";
import { decodeProtobufValue, unwrapRecordsPayload } from "./protobuf-decoder";

function normalizeStringList(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof val === "string" && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed
          .map(String)
          .map((s) => s.trim())
          .filter(Boolean);
      }
    } catch {
      // Fall through to comma-separated splitting
    }
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Parses raw gRPC or JSON response into a validated canonical UserGroupRecord.
 */
export function parseUserGroupRecord(input: unknown): {
  success: boolean;
  data: UserGroupRecord;
  error?: string;
} {
  const fallbackRecord: UserGroupRecord = {
    recordId: "",
    groupLabel: "",
    menuIds: [],
    roleIds: [],
    isActive: true,
  };

  if (!input || typeof input !== "object") {
    return {
      success: false,
      data: fallbackRecord,
      error: "Input must be a non-null object",
    };
  }

  const raw = decodeProtobufValue<Record<string, unknown>>(input);
  const dataObj =
    (raw.data as Record<string, unknown>) || (raw.record as Record<string, unknown>) || raw;

  const candidate: UserGroupRecord = {
    recordId: String(dataObj.recordId || dataObj.id || "")
      .trim()
      .toUpperCase(),
    groupLabel: String(dataObj.groupLabel || dataObj.label || "").trim(),
    menuIds: normalizeStringList(dataObj.menuIds),
    roleIds: normalizeStringList(dataObj.roleIds),
    isActive: dataObj.isActive !== undefined ? Boolean(dataObj.isActive) : true,
    auditData: (dataObj.auditData as UserGroupRecord["auditData"]) || undefined,
  };

  const res = userGroupRecordSchema.safeParse(candidate);
  if (!res.success) {
    return {
      success: false,
      data: candidate,
      error: res.error.issues[0]?.message || "Failed to validate user group record",
    };
  }

  return {
    success: true,
    data: res.data,
  };
}

/**
 * Parses a collection of UserGroupRecord items.
 */
export function parseUserGroupList(input: unknown): {
  success: boolean;
  data: UserGroupRecord[];
  error?: string;
} {
  if (!input) return { success: true, data: [] };

  const rawList = unwrapRecordsPayload(input);
  const targetList =
    rawList.length > 0
      ? rawList
      : Array.isArray(input)
        ? input
        : typeof input === "object"
          ? Object.values(input as Record<string, unknown>)
          : [];

  const parsedList: UserGroupRecord[] = [];
  for (const item of targetList) {
    const parsed = parseUserGroupRecord(item);
    if (parsed.success && parsed.data.recordId) {
      parsedList.push(parsed.data);
    }
  }

  return {
    success: true,
    data: parsedList,
  };
}

/**
 * Safe serialization of UserGroupRecord to wire format for CBS PUT operations.
 */
export function serializeUserGroupToWireJson(record: UserGroupRecord): Record<string, unknown> {
  const result = userGroupRecordSchema.safeParse(record);
  const data = result.success ? result.data : record;

  return {
    recordId: data.recordId,
    groupLabel: data.groupLabel,
    menuIds: data.menuIds || [],
    roleIds: data.roleIds || [],
    isActive: data.isActive !== undefined ? data.isActive : true,
    ...(data.auditData ? { auditData: data.auditData } : {}),
  };
}
