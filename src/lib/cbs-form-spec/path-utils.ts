/**
 * @fileoverview Pure Immutable Path Accessors (getFieldValue, setFieldValue, deleteFieldValue)
 * @module cbs-form-spec/path-utils
 *
 * Core Invariants:
 * - Pure, non-mutating record accessors for flat keys ("AC_NO") and nested dot-paths ("CUSTOMER.profile.name").
 * - Returns a new object reference on writes/deletions without mutating source records.
 * - Safely handles intermediate arrays and missing objects during traversal.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Value Readers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely reads values from flat or nested dot-path object dictionaries.
 * Checks for direct flat hit first, then performs dotted path traversal.
 *
 * @example
 * getFieldValue(values, "IDDEF.IDPREFIX") // values.IDDEF?.IDPREFIX ?? values["IDDEF.IDPREFIX"]
 *
 * @param values Source dictionary or record state.
 * @param path Direct key or dot-notated nested path.
 * @returns Resolved value, or undefined if not found.
 */
export function getFieldValue(
  values: Record<string, unknown> | undefined | null,
  path: string,
): unknown {
  if (!values || !path) return undefined;

  // 1. Direct hit (e.g. flat key or already flattened dictionary)
  if (path in values && values[path] !== undefined) {
    return values[path];
  }

  // 2. Nested path resolution (e.g. "IDDEF.IDPREFIX" -> values?.IDDEF?.IDPREFIX)
  if (path.includes(".")) {
    const segments = path.split(".");
    let current: unknown = values;
    for (const seg of segments) {
      if (current === null || current === undefined || typeof current !== "object") {
        return undefined;
      }
      current = (current as Record<string, unknown>)[seg];
    }
    return current;
  }

  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Value Writers & Mutators (Immutable)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Immutably sets a value at a flat or dot-notated path.
 * Creates intermediate objects or arrays as needed and returns a new cloned record.
 *
 * @example
 * setFieldValue(record, "CUSTOMER.name", "Jane")
 *
 * @param record Source record state.
 * @param path Target property path.
 * @param value New value to assign.
 * @returns Cloned record with updated path value.
 */
export function setFieldValue<T extends Record<string, unknown>>(
  record: T,
  path: string,
  value: unknown,
): T {
  if (!record || !path) return record;

  if (!path.includes(".")) {
    return { ...record, [path]: value };
  }

  const segments = path.split(".");
  const root = { ...record };
  let current: Record<string, unknown> = root;

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];
    const isNextNumeric = /^\d+$/.test(nextSeg);

    const nextVal = current[seg];
    if (Array.isArray(nextVal)) {
      current[seg] = [...nextVal];
    } else if (nextVal && typeof nextVal === "object") {
      current[seg] = { ...(nextVal as Record<string, unknown>) };
    } else {
      current[seg] = isNextNumeric ? [] : {};
    }
    current = current[seg] as Record<string, unknown>;
  }

  current[segments[segments.length - 1]] = value;
  return root;
}

/**
 * Immutably removes a key or array element at a flat or dot-notated path.
 *
 * @param record Source record state.
 * @param path Target property path to remove.
 * @returns Cloned record with target path removed.
 */
export function deleteFieldValue<T extends Record<string, unknown>>(record: T, path: string): T {
  if (!record || !path) return record;

  if (!path.includes(".")) {
    const next = { ...record };
    delete next[path];
    return next;
  }

  const segments = path.split(".");
  const root = { ...record };
  let current: Record<string, unknown> = root;

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (!current[seg] || typeof current[seg] !== "object") {
      return root;
    }
    current[seg] = Array.isArray(current[seg])
      ? [...(current[seg] as unknown[])]
      : { ...(current[seg] as Record<string, unknown>) };
    current = current[seg] as Record<string, unknown>;
  }

  const lastSeg = segments[segments.length - 1];
  if (Array.isArray(current)) {
    const idx = Number(lastSeg);
    if (!Number.isNaN(idx)) {
      current.splice(idx, 1);
    }
  } else {
    delete current[lastSeg];
  }

  return root;
}
