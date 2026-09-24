import "server-only";
import { STATIC_COMMANDS } from "@fixtures";
import { env } from "@/lib/config/env";
import { getOrSet } from "@/lib/core/cache";
import { grpcProcess } from "@/lib/grpc";
import { getServiceUrl } from "@/lib/core/services";
import { getSession } from "@/lib/core/redis-session";
import type { SystemCommandItem } from "@/lib/core/commands";

const CONTROLS_TTL_SECONDS = 600;

function parseControlsPayload(data: any): SystemCommandItem[] {
  if (!data) return [];

  let rawList: any[] = [];
  if (Array.isArray(data)) {
    rawList = data;
  } else if (data?.fields?.records?.list_value?.values) {
    rawList = data.fields.records.list_value.values;
  } else if (data?.records && Array.isArray(data.records)) {
    rawList = data.records;
  } else if (data?.items && Array.isArray(data.items)) {
    rawList = data.items;
  }

  const result: SystemCommandItem[] = [];

  for (const item of rawList) {
    const fields = item?.struct_value?.fields || item?.fields || item;
    const getString = (key: string) =>
      fields?.[key]?.string_value ?? fields?.[key] ?? "";

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

async function fetchControlsFromBackend(tokenParam?: string): Promise<SystemCommandItem[]> {
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

export async function getControlsData(token?: string): Promise<SystemCommandItem[]> {
  const cacheKey = "controls:list";
  return getOrSet(
    cacheKey,
    () => fetchControlsFromBackend(token),
    CONTROLS_TTL_SECONDS,
  );
}
