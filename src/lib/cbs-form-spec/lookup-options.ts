/**
 * @fileoverview Lookup option mapping: the rows of a lookup model become `{ code, label }`
 * options, per the field's PARAMETER (`M` flat list, `A` array inside one record).
 * @module cbs-form-spec/lookup-options
 */

import { logger } from "@/lib/core-logger";
import { type FormFieldParameter, isArrayLookup, parseLookupCondition } from "@/lib/data-schemas";

export interface LookupOption {
  code: string;
  label: string;
}

/** The array an array lookup reads when its `arrayField` is unset. */
const DEFAULT_ARRAY_FIELD = "itemArray";

/**
 * Keys tried, in order, when the PARAMETER names no `codeField` / `displayField`. They cover the
 * shapes the core's lookup tables use (generic `id`/`name`, branches, array items).
 */
const FALLBACK_CODE_KEYS = ["id", "recordId", "code", "branchCode", "itemCode"] as const;
const FALLBACK_LABEL_KEYS = ["name", "title", "branchTitle", "description", "itemLabel"] as const;

/** A row's value under `key`, as written or in lower or upper case. */
const readKey = (rec: Record<string, unknown>, key: string): unknown =>
  rec[key] ?? rec[key.toLowerCase()] ?? rec[key.toUpperCase()];

/** The first fallback key the row has a value for (null and undefined skipped, as `??` does). */
const firstOf = (rec: Record<string, unknown>, keys: readonly string[]): unknown =>
  keys.map((k) => rec[k]).find((v) => v !== undefined && v !== null);

/**
 * Maps a lookup model's rows to options:
 * 1. An array lookup keeps record `recordId` and reads its `arrayField` (default `itemArray`).
 * 2. `condition` (`field == 'value'`) filters the rows. A condition that can't be read shows no
 *    options, never every option, and is logged (the save rules refuse it).
 * 3. Code and label come from `codeField` / `displayField`, else from the fallback keys.
 */
export function resolveLookupOptions(
  rows: readonly unknown[] | undefined,
  param: FormFieldParameter | undefined,
): LookupOption[] {
  if (!rows || !param) return [];
  const isArrayMode = isArrayLookup(param);

  let items: readonly unknown[] = rows;
  if (isArrayMode) {
    const targetId = param.recordId?.trim().toLowerCase();
    const record = (
      targetId
        ? rows.find((item) => {
            const rec = item as Record<string, unknown>;
            return (
              String(rec.id ?? rec.recordId ?? rec.category ?? "")
                .trim()
                .toLowerCase() === targetId
            );
          })
        : rows[0]
    ) as Record<string, unknown> | undefined;
    const arrayKey = param.arrayField?.trim() || DEFAULT_ARRAY_FIELD;
    const nested = record ? readKey(record, arrayKey) : undefined;
    items = Array.isArray(nested) ? nested : [];
  }

  const condition = parseLookupCondition(param.condition);
  if (condition === null) {
    logger.warn("Lookup condition can't be read; no options shown", {
      model: param.modelName,
      condition: param.condition,
    });
    return [];
  }
  if (condition) {
    items = items.filter((item) => {
      if (typeof item !== "object" || item === null) return true;
      const actual = readKey(item as Record<string, unknown>, condition.field);
      return String(actual ?? "").toLowerCase() === condition.value.toLowerCase();
    });
  }

  const codeField = param.codeField?.trim() || "";
  const displayField = param.displayField?.trim() || "";
  const codeKey = codeField || (isArrayMode ? "itemCode" : "id");
  const displayKey = displayField || (isArrayMode ? "itemLabel" : "name");

  return items
    .map((item): LookupOption => {
      if (typeof item !== "object" || item === null) {
        return { code: String(item), label: String(item) };
      }
      const rec = item as Record<string, unknown>;
      const code =
        readKey(rec, codeKey) ?? (codeField ? "" : (firstOf(rec, FALLBACK_CODE_KEYS) ?? ""));
      const label =
        readKey(rec, displayKey) ?? (displayField ? "" : firstOf(rec, FALLBACK_LABEL_KEYS));
      return { code: String(code), label: String(label || code) };
    })
    .filter((option) => Boolean(option.code));
}
