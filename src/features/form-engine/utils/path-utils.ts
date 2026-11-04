/**
 * Pure, safe utility to read values from flat or nested dot-path object dictionaries.
 * e.g. getFieldValue(values, "IDDEF.IDPREFIX") -> values.IDDEF?.IDPREFIX ?? values["IDDEF.IDPREFIX"]
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

/**
 * Pure, immutable generic setter for flat or dot-notated paths.
 * Returns a new object without mutating the input record.
 * e.g. setFieldValue(record, "IDDEF.IDPREFIX", "CUS")
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
