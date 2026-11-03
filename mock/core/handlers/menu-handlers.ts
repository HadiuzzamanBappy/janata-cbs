import "server-only";

import type { ApiResponse } from "@/lib/data-schemas";
import { CbsControlTable } from "@/types";
import { resolveTable } from "../database-router";
import { notFoundResult, successResult } from "../response-factory";

/**
 * Accessor extracting the canonical navigation menu tree (MENU.ONE) from the simulated database.
 */
export function getMockMenuPayload(): unknown {
  const menuTable = resolveTable(CbsControlTable.MENU_TREE);
  if (!menuTable) return null;

  const found = menuTable.LIVE["MENU.ONE"];
  return found ?? null;
}

/**
 * Handles GUM (Get User Menu) request.
 * Automatically resolves and returns the single user navigation tree (MENU.ONE).
 */
export function handleGetMenu(): ApiResponse {
  const menuRecord = getMockMenuPayload();

  if (!menuRecord) {
    return notFoundResult("Navigation menu tree (MENU.ONE) not found in database");
  }

  return successResult(menuRecord, "MENU.TREE record loaded");
}
