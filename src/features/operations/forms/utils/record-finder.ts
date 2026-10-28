import type { CompiledFormSpec, FormElement } from "@/lib/data-schemas";

/**
 * Identifies the primary key / record ID field definition in a form spec.
 */
export function findPrimaryKeyField(spec: CompiledFormSpec | null): FormElement | undefined {
  if (!spec?.frmElements?.sections) return undefined;
  const allFields = spec.frmElements.sections.flatMap((s) => s.fields || []);
  return allFields.find(
    (f) =>
      f.NAME.toUpperCase() === "ID" ||
      f.NAME.toUpperCase().includes("CODE") ||
      f.NAME.toUpperCase().includes("NUMBER") ||
      f.NAME.toUpperCase().includes("ID"),
  );
}
