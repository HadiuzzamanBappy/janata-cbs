import type { CompiledFormSpec } from "@/lib/data-schemas";

/**
 * Identifies the primary key / record ID field definition in a form spec.
 */
export function findPrimaryKeyField(spec: CompiledFormSpec | null) {
  if (!spec?.fields) return undefined;
  return spec.fields.find(
    (f: { fieldKey: string }) =>
      f.fieldKey.toUpperCase() === "ID" ||
      f.fieldKey.toUpperCase().includes("CODE") ||
      f.fieldKey.toUpperCase().includes("NUMBER") ||
      f.fieldKey.toUpperCase().includes("ID"),
  );
}
