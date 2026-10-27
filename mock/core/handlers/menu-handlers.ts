import "server-only";

import type { ApiResponse } from "@/types";
import { CbsControlTable } from "@/types";
import { resolveTable } from "../database-router";
import { successResult } from "../response-factory";

/**
 * Accessor extracting the canonical navigation menu tree from the simulated database.
 */
export function getMockMenuPayload(): unknown {
  const menuTable = resolveTable(CbsControlTable.MENU_TREE);
  const main = menuTable?.LIVE["MENU.MAIN"] as { menuTree?: unknown } | undefined;
  if (main?.menuTree) return main.menuTree;
  const first = menuTable?.getList()[0] as { menuTree?: unknown } | undefined;
  return first?.menuTree ?? [];
}

/**
 * Handles GUM (Get User Menu Navigation Tree) & GCM (Get Child Menu).
 */
export function handleGetMenu(): ApiResponse {
  return successResult(getMockMenuPayload(), "Menu loaded from simulated database");
}
