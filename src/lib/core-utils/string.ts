/**
 * Convert string into clean Title Case (Capitalize words).
 * Keeps common abbreviations like HO, PLC, IT, etc. uppercase.
 */
export function toTitleCase(str: string): string {
  if (!str) return "";

  // Known acronyms to preserve as uppercase
  const acronyms = new Set(["HO", "PLC", "CBS", "IT", "HR", "ATM", "POS", "USD", "BDT", "EUR"]);

  return str
    .trim()
    .toLowerCase()
    .replace(/(?:^|\s|[-.,/])([a-z]+)/g, (match, word: string) => {
      const upper = word.toUpperCase();
      if (acronyms.has(upper)) {
        return match.replace(word, upper);
      }
      return match.replace(word, word.charAt(0).toUpperCase() + word.slice(1));
    });
}

/**
 * Converts a camelCase property name to a clean, human-readable Title Case label.
 * E.g. "accountNumber" -> "Account Number", "nomineeNid" -> "Nominee NID".
 */
export function formatNameToLabel(name: string): string {
  if (!name || typeof name !== "string") return "";

  // 1. Insert space before uppercase letters: "accountNumber" -> "account Number"
  const spaced = name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();

  // 2. Format words to title case with acronym awareness
  return toTitleCase(spaced);
}
