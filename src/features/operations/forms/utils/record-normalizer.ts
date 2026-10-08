import type { FormSchema } from "@/lib/schemas";

// Helper to strip non-alphanumeric chars for fuzzy matching
const simplify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Known semantic aliases across enquiry columns and form schema fields
const SEMANTIC_MAP: Record<string, string[]> = {
  "user.id": ["userid", "empid", "id", "employeeid", "user_id"],
  "full.name": ["fullname", "empname", "name", "employeename", "name1", "full_name"],
  role: ["role", "userrole", "designation", "user_role"],
  branch: ["branch", "branchcode", "branch_code"],
  "customer.id": ["customerid", "custid", "id", "customer_id"],
  "name.1": ["name1", "name", "customername", "fullname", "shortname"],
  "account.title": ["accounttitle", "title", "customername", "name"],
  status: ["status", "recordstatus", "record_status"],
};

/**
 * Normalizes incoming raw DB / Enquiry record data into matching FormSchema field keys.
 */
export function normalizeRecordData(
  raw: Record<string, unknown> | undefined,
  targetSchema: FormSchema | null,
): Record<string, unknown> {
  if (!targetSchema || !raw) return raw || {};
  const result: Record<string, unknown> = { ...raw };

  for (const field of targetSchema.fields) {
    // If field already has a value, preserve it
    if (
      result[field.name] !== undefined &&
      result[field.name] !== null &&
      result[field.name] !== ""
    ) {
      continue;
    }

    const simplifiedFieldName = simplify(field.name);
    const aliases = SEMANTIC_MAP[field.name.toLowerCase()] || [simplifiedFieldName];

    // Look for direct or alias matches in raw record
    for (const [k, v] of Object.entries(raw)) {
      if (v === undefined || v === null || v === "") continue;
      const simplifiedKey = simplify(k);
      if (simplifiedKey === simplifiedFieldName || aliases.includes(simplifiedKey)) {
        result[field.name] = v;
        break;
      }
    }
  }

  return result;
}
