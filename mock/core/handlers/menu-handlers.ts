import "server-only";

import type { ApiResponse } from "@/types";
import { CbsControlTable } from "@/types";
import { resolveTable } from "../database-router";
import { notFoundResult, successResult } from "../response-factory";

/**
 * Accessor extracting the canonical navigation menu tree from the simulated database.
 */
export function getMockMenuPayload(): unknown {
  const menuTable = resolveTable(CbsControlTable.MENU_TREE);
  const main = menuTable?.LIVE["MENU.MAIN"] as { menuTree?: unknown } | undefined;
  if (main?.menuTree) return main.menuTree;
  return null;
}

/**
 * Handles GUM (Get User Menu Navigation Tree) & GCM (Get Child Menu).
 */
export function handleGetMenu(): ApiResponse {
  const menu = getMockMenuPayload();
  if (!menu) {
    return notFoundResult("Navigation menu tree (MENU.MAIN) not found in database");
  }
  return successResult(menu, "Menu loaded from simulated database");
}
