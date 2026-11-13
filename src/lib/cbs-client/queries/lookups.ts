import { queryOptions } from "@tanstack/react-query";
import { clientConfig } from "@/lib/core-config";
import { unwrapRecordsPayload } from "@/lib/data-parsers";
import type {
  ControlCommand,
  MenuAction,
  MenuCatalogActionItem,
  MenuType,
  ModelProperty,
} from "@/lib/data-schemas";
import { CbsControlTable } from "@/types";
import { createModelPayloads } from "../payloads/base-model";
import { sendCbsRequest } from "../transport/proxy-client";
import { loadModelConfigRecord } from "./schemas";

export interface BranchDirectoryItem {
  code: string;
  name: string;
  type: string;
}

export type ModelLookupPayload =
  | { kind: "records"; rows: unknown[] }
  | { kind: "metamodel"; properties: ModelProperty[] };

const branchPayloads = createModelPayloads(CbsControlTable.BRANCH);
const menuPayloads = createModelPayloads(CbsControlTable.MENU);
const controlPayloads = createModelPayloads(CbsControlTable.CONTROL);

/**
 * Tier: Master Reference Directories & Form Dropdown Lookups (`BRANCH`, `SC.LOOKUP`, etc.).
 */
export const lookupQueries = {
  branchList: () =>
    queryOptions<BranchDirectoryItem[]>({
      queryKey: ["app", "branches"] as const,
      staleTime: 10 * 60 * 1000,
      queryFn: async () => {
        const res = await sendCbsRequest<unknown>(branchPayloads.list(), { silent: true });
        if (res.status !== "SUCCESS") {
          throw new Error(res.message || "Failed to load branch directory");
        }

        const rawRecords = unwrapRecordsPayload<{
          recordId?: string;
          branchTitle?: string;
          branchType?: string;
        }>(res.data);
        const list = Array.isArray(rawRecords) ? rawRecords : [];

        if (list.length === 0) {
          throw new Error("No branch records found from core banking service");
        }

        const mapped = list
          .map((b) => {
            const code = String(b.recordId ?? "").trim();
            const name = String(b.branchTitle ?? code).trim() || code;
            const isCentral =
              code === clientConfig.centralBranch ||
              code.replace(/\D/g, "") === clientConfig.centralBranch.replace(/\D/g, "");
            const type = isCentral ? "Head Office" : String(b.branchType ?? "General").trim();
            return { code, name, type };
          })
          .filter((b) => Boolean(b.code));

        if (mapped.length === 0) {
          throw new Error("Failed to parse branch directory records");
        }

        return mapped;
      },
    }),

  modelLookup: (controlName: CbsControlTable | string) => {
    const cleanModel = (controlName || "").trim().toUpperCase();
    return queryOptions<ModelLookupPayload>({
      queryKey: ["cbs", "model-lookup", cleanModel] as const,
      enabled: Boolean(cleanModel),
      staleTime: 2 * 60 * 1000,
      queryFn: async () => {
        const res = await sendCbsRequest<unknown[] | { items?: unknown[] }>(
          createModelPayloads(cleanModel).list(),
          { silent: true },
        );
        if (res.status === "SUCCESS") {
          const resData = res.data;
          const rawList: unknown[] = Array.isArray(resData)
            ? resData
            : Array.isArray((resData as { items?: unknown[] })?.items)
              ? ((resData as { items: unknown[] }).items ?? [])
              : [];
          if (rawList.length > 0) {
            return { kind: "records", rows: rawList };
          }
        }
        const metaRecord = await loadModelConfigRecord(cleanModel);
        return { kind: "metamodel", properties: metaRecord.PROPERTIES || [] };
      },
    });
  },

  menuList: () =>
    queryOptions<MenuCatalogActionItem[]>({
      queryKey: ["cbs", "menu-designer", "catalog"] as const,
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const res = await sendCbsRequest<unknown>(menuPayloads.list(), { silent: true });
        if (res.status !== "SUCCESS") {
          throw new Error(res.message || "Failed to load MENU catalog");
        }
        if (!res.data) return [];

        const rawList = unwrapRecordsPayload(res.data);
        return (rawList as Record<string, unknown>[])
          .filter((r) => Boolean(r.recordId || r.id))
          .map((r) => ({
            id: String(r.recordId || r.id),
            label: String(r.label || r.recordId || r.id),
            command: String(r.command || ""),
            menuType: (r.menuType ? String(r.menuType) : "FORM") as MenuType,
            menuAction: (r.menuAction ? String(r.menuAction) : "SCREEN") as MenuAction,
          }));
      },
    }),

  controlList: () =>
    queryOptions<ControlCommand[]>({
      queryKey: ["cbs", "controls", "list"] as const,
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const res = await sendCbsRequest<unknown>(controlPayloads.list(), { silent: true });
        if (res.status !== "SUCCESS") {
          return [];
        }
        if (!res.data) return [];

        const rawList = unwrapRecordsPayload(res.data);
        return (rawList as Record<string, unknown>[])
          .filter((r) => Boolean(r.command || r.recordId || r.id))
          .map((r) => {
            const command = String(r.command || r.recordId || r.id)
              .trim()
              .toUpperCase();
            const rawAliases = Array.isArray(r.aliases) ? r.aliases : [];
            const aliases = rawAliases.map((a) => String(a).trim().toUpperCase()).filter(Boolean);
            return {
              command,
              title: String(r.title || command),
              aliases,
              controlAction: (r.controlAction
                ? String(r.controlAction)
                : "SCREEN") as ControlCommand["controlAction"],
              controlType: (r.controlType
                ? String(r.controlType)
                : "FORM") as ControlCommand["controlType"],
            };
          });
      },
    }),
};
