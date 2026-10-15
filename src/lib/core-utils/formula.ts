/**
 * Evaluates simple mathematical and reference formulas in dynamic banking forms.
 * Supports token referencing like:
 *   "principalAmount + (principalAmount * interestRate / 100)"
 *   "cashInHand - withdrawalAmount"
 */
export function evaluateFormula(
  formula: string,
  context: Record<string, unknown>,
): number | string | undefined {
  if (!formula || typeof formula !== "string") return undefined;

  try {
    // Replace valid alphanumeric identifier tokens with their values from context
    const expression = formula.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
      const val = context[match];
      if (val === undefined || val === null || val === "") {
        return "0";
      }
      const num = Number(val);
      return Number.isNaN(num) ? `"${String(val)}"` : String(num);
    });

    // Safely execute math expressions without full arbitrary code execution
    // Allow only basic arithmetic symbols, numbers, spaces, parentheses
    if (!/^[\d\s+\-*/().%]+$/.test(expression)) {
      return undefined;
    }

    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${expression});`)();
    if (typeof result === "number" && !Number.isNaN(result)) {
      return Number(result.toFixed(2));
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extracts referenced field/identifier tokens from a formula string.
 * Used to construct an inverted dependency graph (DAG) for O(1) reactive recomputations.
 *
 * Example:
 *   extractFormulaDependencies("principalAmount + (principalAmount * interestRate / 100)")
 *   // => ["principalAmount", "interestRate"]
 */
export function extractFormulaDependencies(formula: string): string[] {
  if (!formula || typeof formula !== "string") return [];
  const matches = formula.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g);
  if (!matches) return [];
  return Array.from(new Set(matches));
}
