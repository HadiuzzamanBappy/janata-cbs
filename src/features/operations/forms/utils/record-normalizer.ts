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
 * Normalizes incoming raw DB / Enquiry record data into matching Form field keys.
 */
export function normalizeRecordData(
  raw: Record<string, unknown> | undefined,
  targetSchema: { fields?: Array<{ fieldKey: string }> } | null,
): Record<string, unknown> {
  if (!targetSchema || !raw) return raw || {};
  const result: Record<string, unknown> = { ...raw };

  for (const field of targetSchema.fields || []) {
    if (
      result[field.fieldKey] !== undefined &&
      result[field.fieldKey] !== null &&
      result[field.fieldKey] !== ""
    ) {
      continue;
    }

    const simplifiedFieldName = simplify(field.fieldKey);
    const aliases = SEMANTIC_MAP[field.fieldKey.toLowerCase()] || [simplifiedFieldName];

    for (const [k, v] of Object.entries(raw)) {
      if (v === undefined || v === null || v === "") continue;
      const simplifiedKey = simplify(k);
      if (simplifiedKey === simplifiedFieldName || aliases.includes(simplifiedKey)) {
        result[field.fieldKey] = v;
        break;
      }
    }
  }

  return result;
}
