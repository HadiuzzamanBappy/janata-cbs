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
