import { queryOptions } from "@tanstack/react-query";
import { clientConfig } from "@/lib/core-config";
import { parseBranchDirectory, unwrapRecordsPayload } from "@/lib/data-parsers";
import {
  type ControlCommand,
  isApiSuccess,
  type MenuAction,
  type MenuCatalogActionItem,
  type MenuType,
} from "@/lib/data-schemas";
import { CbsControlTable } from "@/types";
import { createModelPayloads } from "../payloads/base-model";
import { sendCbsRequest } from "../transport/proxy-client";

export interface BranchDirectoryItem {
  code: string;
  name: string;
  type: string;
}

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
        if (!isApiSuccess(res)) {
          throw new Error(res.message || "Failed to load branch directory");
        }

        const records = parseBranchDirectory(res.data);
        if (records.length === 0) {
          throw new Error("No branch records found from core banking service");
        }

        return records.map(({ code, name, branchType }) => {
          const isCentral =
            code === clientConfig.centralBranch ||
            code.replace(/\D/g, "") === clientConfig.centralBranch.replace(/\D/g, "");
          return { code, name, type: isCentral ? "Head Office" : branchType || "General" };
        });
      },
    }),

  /** GRL rows of the referenced model; a failed or empty list yields no options. */
  modelLookup: (controlName: CbsControlTable | string) => {
    const cleanModel = (controlName || "").trim().toUpperCase();
    return queryOptions<unknown[]>({
      queryKey: ["cbs", "model-lookup", cleanModel] as const,
      enabled: Boolean(cleanModel),
      staleTime: 2 * 60 * 1000,
      queryFn: async () => {
        const res = await sendCbsRequest<unknown>(createModelPayloads(cleanModel).list(), {
          silent: true,
        });
        if (!isApiSuccess(res)) {
          throw new Error(res.message || `Failed to load ${cleanModel} lookup`);
        }
        return unwrapRecordsPayload(res.data);
      },
    });
  },

  menuList: () =>
    queryOptions<MenuCatalogActionItem[]>({
      queryKey: ["cbs", "menu-designer", "catalog"] as const,
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const res = await sendCbsRequest<unknown>(menuPayloads.list(), { silent: true });
        if (!isApiSuccess(res)) {
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
        if (!isApiSuccess(res)) {
          return [];
        }
        if (!res.data) return [];

        const rawList = unwrapRecordsPayload(res.data);
        return (rawList as Record<string, unknown>[])
          .filter((r) => Boolean(r.command || r.controlName || r.recordId || r.id))
          .map((r) => {
            const canonicalCommand = String(r.controlName || r.command || r.recordId || r.id)
              .trim()
              .toUpperCase();
            const recordId = String(r.recordId || r.id || "")
              .trim()
              .toUpperCase();
            const rawAliases = Array.isArray(r.aliases) ? r.aliases : [];
            const aliases = rawAliases.map((a) => String(a).trim().toUpperCase()).filter(Boolean);

            if (recordId && recordId !== canonicalCommand && !aliases.includes(recordId)) {
              aliases.push(recordId);
            }

            return {
              command: canonicalCommand,
              title: String(r.title || r.description || canonicalCommand),
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
