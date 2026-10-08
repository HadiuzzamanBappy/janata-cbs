import {
  type UserGroupRecord,
  userGroupRecordSchema,
} from "@/lib/schemas/user-group-schema";

/**
 * Parses raw gRPC or JSON response into a validated canonical UserGroupRecord
 */
export function parseUserGroupRecord(input: unknown): {
  success: boolean;
  data: UserGroupRecord;
  error?: string;
} {
  try {
    if (!input || typeof input !== "object") {
      return {
        success: false,
        data: {
          recordId: "",
          groupLabel: "",
          menuIds: [],
          roleIds: [],
          isActive: true,
        },
        error: "Input must be a non-null object",
      };
    }

    const raw = input as Record<string, unknown>;

    // Handle gRPC or nested envelope
    const dataObj =
      (raw.data as Record<string, unknown>) ||
      (raw.record as Record<string, unknown>) ||
      raw;

    // Handle stringified menuIds/roleIds if stored as comma-separated or JSON string
    let menuIds: string[] = [];
    if (Array.isArray(dataObj.menuIds)) {
      menuIds = dataObj.menuIds.map(String);
    } else if (typeof dataObj.menuIds === "string" && dataObj.menuIds.trim()) {
      try {
        const parsed = JSON.parse(dataObj.menuIds);
        menuIds = Array.isArray(parsed) ? parsed.map(String) : dataObj.menuIds.split(",").map((s) => s.trim());
      } catch {
        menuIds = dataObj.menuIds.split(",").map((s) => s.trim());
      }
    }

    let roleIds: string[] = [];
    if (Array.isArray(dataObj.roleIds)) {
      roleIds = dataObj.roleIds.map(String);
    } else if (typeof dataObj.roleIds === "string" && dataObj.roleIds.trim()) {
      try {
        const parsed = JSON.parse(dataObj.roleIds);
        roleIds = Array.isArray(parsed) ? parsed.map(String) : dataObj.roleIds.split(",").map((s) => s.trim());
      } catch {
        roleIds = dataObj.roleIds.split(",").map((s) => s.trim());
      }
    }

    const candidate: UserGroupRecord = {
      recordId: String(dataObj.recordId || dataObj.id || dataObj["@ID"] || "").trim().toUpperCase(),
      groupLabel: String(dataObj.groupLabel || dataObj.label || "").trim(),
      menuIds,
      roleIds,
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
  } catch (err) {
    return {
      success: false,
      data: {
        recordId: "",
        groupLabel: "",
        menuIds: [],
        roleIds: [],
        isActive: true,
      },
      error: err instanceof Error ? err.message : "Unknown parsing error",
    };
  }
}

/**
 * Parses a collection of UserGroupRecord items
 */
export function parseUserGroupList(input: unknown): {
  success: boolean;
  data: UserGroupRecord[];
  error?: string;
} {
  try {
    if (!input) return { success: true, data: [] };

    let rawList: unknown[] = [];
    if (Array.isArray(input)) {
      rawList = input;
    } else if (typeof input === "object" && input !== null) {
      const obj = input as Record<string, unknown>;
      if (Array.isArray(obj.records)) {
        rawList = obj.records;
      } else if (Array.isArray(obj.data)) {
        rawList = obj.data;
      } else {
        rawList = Object.values(obj);
      }
    }

    const parsedList: UserGroupRecord[] = [];
    for (const item of rawList) {
      const parsed = parseUserGroupRecord(item);
      if (parsed.success && parsed.data.recordId) {
        parsedList.push(parsed.data);
      }
    }

    return {
      success: true,
      data: parsedList,
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Failed to parse user group list",
    };
  }
}

/**
 * Safe serialization of UserGroupRecord to wire format for CBS PUT operations
 */
export function serializeUserGroupToWireJson(
  record: UserGroupRecord,
): Record<string, unknown> {
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
