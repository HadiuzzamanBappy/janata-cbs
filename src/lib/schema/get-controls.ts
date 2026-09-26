import "server-only";
import { STATIC_COMMANDS } from "@fixtures";
import { env } from "@/lib/config/env";
import { getOrSet } from "@/lib/core/cache";
import type { SystemCommandItem } from "@/lib/core/commands";
import { getSession } from "@/lib/core/redis-session";
import { getServiceUrl } from "@/lib/core/services";
import { grpcProcess } from "@/lib/grpc";

const CONTROLS_TTL_SECONDS = 600;

function parseControlsPayload(data: unknown): SystemCommandItem[] {
  if (!data) return [];

  let rawList: unknown[] = [];
  if (Array.isArray(data)) {
    rawList = data;
  } else if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    const fields = obj.fields as Record<string, unknown> | undefined;
    const records = fields?.records as Record<string, unknown> | undefined;
    const listValue = records?.list_value as
      | Record<string, unknown>
      | undefined;
    if (Array.isArray(listValue?.values)) {
      rawList = listValue.values;
    } else if (Array.isArray(obj.records)) {
      rawList = obj.records;
    } else if (Array.isArray(obj.items)) {
      rawList = obj.items;
    }
  }

  const result: SystemCommandItem[] = [];

  for (const item of rawList) {
    const itemObj = item as Record<string, unknown> | undefined;
    const structVal = itemObj?.struct_value as
      | Record<string, unknown>
      | undefined;
    const fields = (structVal?.fields || itemObj?.fields || itemObj) as
      | Record<string, { string_value?: string } | string>
      | undefined;
    const getString = (key: string) => {
      const val = fields?.[key];
      if (typeof val === "object" && val !== null && "string_value" in val) {
        return val.string_value ?? "";
      }
      return typeof val === "string" ? val : "";
    };

    const cmdName = getString("controlName") || getString("recordId");
    const desc = getString("description") || cmdName;

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

async function fetchControlsFromBackend(
  tokenParam?: string,
): Promise<SystemCommandItem[]> {
  if (env.MODEL_SOURCE === "static") {
    return parseControlsPayload(STATIC_COMMANDS.data);
  }

  try {
    const session = await getSession();
    const token = tokenParam || session?.token;
    const userId = session?.userId || session?.currUser?.userId || "SYSUSER";
    const branchCode =
      session?.currUser?.branchCode ||
      env.NEXT_PUBLIC_CENTRAL_BRANCH ||
      "JB9999";

    const targetServiceKey =
      process.env.NODE_ENV === "development" ? "defaultdev" : "default";
    const address = getServiceUrl(targetServiceKey);

    const res = await grpcProcess(
      address,
      "nonfinancial",
      {
        idempotencyKey: "",
        clientId: "WEB-CLIENT",
        requestType: "GRL",
        controlName: "CONTROL",
        recordFunction: "L",
        recordId: "",
        branchCode,
        authLevel: 1,
        userId,
        data: {},
      },
      { token },
    );

    if (res.statusCode === 200 && res.data) {
      const items = parseControlsPayload(res.data);
      if (items.length > 0) return items;
    }

    return parseControlsPayload(STATIC_COMMANDS.data);
  } catch (err) {
    console.warn(
      "[controls] gRPC fetch failed, falling back to static commands:",
      err,
    );
    return parseControlsPayload(STATIC_COMMANDS.data);
  }
}

export async function getControlsData(
  token?: string,
): Promise<SystemCommandItem[]> {
  const cacheKey = "controls:list";
  return getOrSet(
    cacheKey,
    () => fetchControlsFromBackend(token),
    CONTROLS_TTL_SECONDS,
  );
}
