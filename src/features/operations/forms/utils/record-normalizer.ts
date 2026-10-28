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
  targetSchema: { frmElements?: { sections?: Array<{ fields?: Array<{ NAME: string }> }> }; fields?: Array<{ fieldKey: string }> } | null,
): Record<string, unknown> {
  if (!targetSchema || !raw) return raw || {};
  const result: Record<string, unknown> = { ...raw };

  const fieldKeys: string[] = [];
  if (targetSchema.frmElements?.sections) {
    for (const s of targetSchema.frmElements.sections) {
      for (const f of s.fields || []) {
        if (f.NAME) fieldKeys.push(f.NAME);
      }
    }
  } else if (targetSchema.fields) {
    for (const f of targetSchema.fields) {
      if (f.fieldKey) fieldKeys.push(f.fieldKey);
    }
  }

  for (const key of fieldKeys) {
    if (
      result[key] !== undefined &&
      result[key] !== null &&
      result[key] !== ""
    ) {
      continue;
    }

    const simplifiedFieldName = simplify(key);
    const aliases = SEMANTIC_MAP[key.toLowerCase()] || [simplifiedFieldName];

    for (const [k, v] of Object.entries(raw)) {
      if (v === undefined || v === null || v === "") continue;
      const simplifiedKey = simplify(k);
      if (simplifiedKey === simplifiedFieldName || aliases.includes(simplifiedKey)) {
        result[key] = v;
        break;
      }
    }
  }

  return result;
}
