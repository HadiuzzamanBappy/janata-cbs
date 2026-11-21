import {
  type FilterCriteriaMap,
  type INQSelectField,
  INQUIRY_BRANCH_FIELD,
  type InquiryConfigRecord,
  type InquiryCriteriaParam,
  type InquiryOperatorCriterion,
  isOperandAllowed,
  parseFixedSelection,
  type SelectionOperand,
} from "@/lib/data-schemas";

/** The operand a filter runs with: the designer's when it is locked, otherwise the operator's. */
function effectiveOperand(field: INQSelectField, requested: SelectionOperand): SelectionOperand {
  return field.selectFieldOperatorFixed.trim() ? field.selectFieldOperator : requested;
}

/**
 * The criteria screen's starting state: each filter's configured default value and operand.
 */
export function buildDefaultCriteria(fields: readonly INQSelectField[] = []): FilterCriteriaMap {
  const criteria: FilterCriteriaMap = {};
  for (const f of fields) {
    if (!f.selectFieldName.trim()) continue;
    criteria[f.selectFieldName] = { value: f.selectFieldValue, operand: f.selectFieldOperator };
  }
  return criteria;
}

/**
 * The operator's filter values as the browser sends them (`data.queryString` of INQ): one entry per
 * configured filter that has a value, in config order, with a locked operand kept as configured.
 * Keys that aren't a configured filter are never sent. Branch and fixed selection are not here:
 * `/api/proxy` adds them from the saved inquiry (`composeInquiryQuery`).
 */
export function serializeCriteriaToWire(
  criteria: FilterCriteriaMap,
  fields: readonly INQSelectField[],
): InquiryOperatorCriterion[] {
  const result: InquiryOperatorCriterion[] = [];
  for (const field of fields) {
    const name = field.selectFieldName.trim();
    const crit = criteria[field.selectFieldName];
    const value = crit?.value.trim() ?? "";
    if (!name || !value) continue;
    result.push({
      selectFieldName: name,
      selectFieldOperator: effectiveOperand(field, crit.operand),
      selectFieldValue: value,
    });
  }
  return result;
}

type ComposedInquiryQuery =
  | { readonly ok: true; readonly queryString: InquiryCriteriaParam[] }
  | { readonly ok: false; readonly error: string };

const refuse = (error: string): ComposedInquiryQuery => ({ ok: false, error });

/**
 * Server side of an inquiry run: the core's `queryString`, built from the saved inquiry and the
 * operator's filters, in this order: the branch filter (branch-wise inquiries, pinned to the
 * session branch), the fixed selection, then the operator's filters. It refuses (never drops)
 * anything that could widen the result: an invalid fixed selection, a filter the inquiry doesn't
 * define, a filter the fixed selection or the branch already sets, a changed locked operand, a
 * pattern operand on a non-text filter, or a missing required filter.
 */
export function composeInquiryQuery(
  config: InquiryConfigRecord,
  criteria: readonly InquiryOperatorCriterion[],
  sessionBranch: string,
): ComposedInquiryQuery {
  const info = config.INQInfo;
  const branchKey = INQUIRY_BRANCH_FIELD.toLowerCase();
  const keyOf = (name: string) => name.trim().toLowerCase();

  const fixed = parseFixedSelection(info.fixedSelection);
  if (fixed.invalid.length > 0) {
    return refuse(`Inquiry fixed selection is invalid: ${fixed.invalid.join("; ")}`);
  }
  const fixedKeys = new Set(fixed.criteria.map((c) => keyOf(c.selectFieldName)));
  if (info.showBranchWise && fixedKeys.has(branchKey)) {
    return refuse(`A branch-wise inquiry can't fix "${INQUIRY_BRANCH_FIELD}" in its selection`);
  }
  const branch = sessionBranch.trim();
  if (info.showBranchWise && !branch) return refuse("The session has no branch to filter on");

  const fields = new Map(config.INQSelectField.map((f) => [keyOf(f.selectFieldName), f]));
  const sent = new Set<string>();
  const operatorCriteria: InquiryCriteriaParam[] = [];
  for (const crit of criteria) {
    const key = keyOf(crit.selectFieldName);
    const field = fields.get(key);
    if (!field) return refuse(`"${crit.selectFieldName}" is not a filter of this inquiry`);
    if (sent.has(key)) return refuse(`Filter "${field.selectFieldName}" was sent twice`);
    if (fixedKeys.has(key)) return refuse(`"${field.selectFieldName}" is fixed by the inquiry`);
    if (info.showBranchWise && key === branchKey) {
      return refuse("The branch filter of a branch-wise inquiry comes from your session");
    }
    if (
      field.selectFieldOperatorFixed.trim() &&
      crit.selectFieldOperator !== field.selectFieldOperator
    ) {
      return refuse(
        `The operator of "${field.selectFieldName}" is locked to ${field.selectFieldOperator}`,
      );
    }
    if (!isOperandAllowed(field.selectFieldType, crit.selectFieldOperator)) {
      return refuse(`Operator ${crit.selectFieldOperator} works only on text filters`);
    }
    sent.add(key);
    operatorCriteria.push({
      selectFieldName: field.selectFieldName.trim(),
      selectFieldType: field.selectFieldType,
      selectFieldOperator: crit.selectFieldOperator,
      selectFieldValue: crit.selectFieldValue.trim(),
    });
  }

  const missing = config.INQSelectField.filter(
    (f) => f.selectFieldRequired && !sent.has(keyOf(f.selectFieldName)),
  );
  if (missing.length > 0) {
    return refuse(
      `Required filter missing: ${missing.map((f) => f.selectFieldDisplay || f.selectFieldName).join(", ")}`,
    );
  }

  const branchCriteria: InquiryCriteriaParam[] = info.showBranchWise
    ? [
        {
          selectFieldName: INQUIRY_BRANCH_FIELD,
          selectFieldType: "text",
          selectFieldOperator: "EQ",
          selectFieldValue: branch,
        },
      ]
    : [];
  return { ok: true, queryString: [...branchCriteria, ...fixed.criteria, ...operatorCriteria] };
}
