import "server-only";

import type { ApiResponse, CbsWirePayload, InquiryCriteriaParam } from "@/lib/data-schemas";
import { resolveTable } from "../database-router";
import { notFoundResult, successResult } from "../response-factory";

type Row = Record<string, unknown>;

/** A row's value for a filter field: exact key, then case-insensitive, then a dotted path. */
function fieldValue(row: Row, name: string): unknown {
  if (name in row) return row[name];
  const key = Object.keys(row).find((k) => k.toLowerCase() === name.toLowerCase());
  if (key) return row[key];
  return name.split(".").reduce<unknown>((node, part) => {
    return node && typeof node === "object" ? (node as Row)[part] : undefined;
  }, row);
}

function compare(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (a !== "" && b !== "" && !Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}

/** The core's operands, applied the way an operator reads them (text compares ignore case). */
function matches(row: Row, criterion: InquiryCriteriaParam): boolean {
  const raw = fieldValue(row, criterion.selectFieldName);
  const cell = raw === undefined || raw === null ? "" : String(raw).toLowerCase();
  const value = criterion.selectFieldValue.toLowerCase();
  switch (criterion.selectFieldOperator) {
    case "EQ":
      return cell === value;
    case "NE":
      return cell !== value;
    case "GT":
      return compare(cell, value) > 0;
    case "GE":
      return compare(cell, value) >= 0;
    case "LT":
      return compare(cell, value) < 0;
    case "LE":
      return compare(cell, value) <= 0;
    case "RG": {
      const [from = "", to = ""] = value.split(",").map((v) => v.trim());
      return compare(cell, from) >= 0 && compare(cell, to) <= 0;
    }
    case "CT":
      return cell.includes(value);
    case "SW":
      return cell.startsWith(value);
    case "EW":
      return cell.endsWith(value);
    case "LK": {
      const pattern = value.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      return new RegExp(`^${pattern}$`).test(cell);
    }
  }
}

/**
 * Handles INQ (Dynamic Inquiry Execution). `/api/proxy` has already resolved the saved inquiry, so
 * `controlName` is the target table (`MODEL$UNA` reads its unauthorized copies) and
 * `data.queryString` is the full filter (branch, fixed selection, operator filters), applied here
 * like the core does. An unknown table is 404 RECORD_NOT_FOUND.
 */
export function handleInquiry(payload: CbsWirePayload): ApiResponse {
  const target = (payload.controlName || "").trim().toUpperCase();
  const isUna = target.includes("$UNA") || target.includes("$NAU");
  const targetModel = target.split("$")[0];

  const table = resolveTable(targetModel);
  if (!table) return notFoundResult(`Target database table "${targetModel}" not found`);

  const queryString = payload.data?.queryString;
  const criteria = Array.isArray(queryString) ? (queryString as InquiryCriteriaParam[]) : [];
  const matched = (table.getList(isUna ? "INAU" : "LIVE") as Row[]).filter((row) =>
    criteria.every((c) => matches(row, c)),
  );
  const rawCurPage = Number(payload.data?.curPage);
  const rawPerPage = Number(payload.data?.perPage);
  const curPage = Number.isInteger(rawCurPage) && rawCurPage > 0 ? rawCurPage : 1;
  const perPage = Number.isInteger(rawPerPage) && rawPerPage > 0 ? rawPerPage : matched.length;
  const start = (curPage - 1) * perPage;
  const records = perPage > 0 ? matched.slice(start, start + perPage) : matched;
  return successResult(
    { records, total: matched.length },
    `Inquiry executed successfully against ${targetModel}`,
  );
}
