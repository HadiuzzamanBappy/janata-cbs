/**
 * Resolve the data array a body component should consume.
 *
 * Lookup order (first match wins):
 *   1. componentDataSources[comp._id]    — v5.1: per-component data (preferred)
 *   2. centralData[comp.dataSourceKey]   — v5: named central store
 *   3. comp.tableDataRows                — legacy embedded list (v4 and earlier)
 *   4. fallbackRows                      — typically PREVIEW_DATA_ROWS for design-time preview
 *
 * Always returns an array (never null/undefined) so callers can iterate
 * unconditionally. The four-tier fallback chain is the same one the PDF
 * renderer expects — DO NOT short-circuit it without also revisiting
 * `pdf/renderers/renderTable` and the canvas table preview.
 */
export function resolveCompData(
  comp: { _id?: string; dataSourceKey?: string; tableDataRows?: any[] } | null | undefined,
  centralData: Record<string, any[]> | undefined,
  componentDataSources: Record<string, any[]> | undefined,
  fallbackRows: any[],
): any[] {
  // 1. component-specific data
  if (comp?._id && componentDataSources && Array.isArray(componentDataSources[comp._id])) {
    return componentDataSources[comp._id];
  }
  // 2. named central data
  if (comp?.dataSourceKey && centralData && Array.isArray(centralData[comp.dataSourceKey])) {
    return centralData[comp.dataSourceKey];
  }
  // 3. legacy embedded
  if (comp?.tableDataRows && comp.tableDataRows.length > 0) {
    return comp.tableDataRows;
  }
  // 4. fallback (preview data)
  return fallbackRows || [];
}
