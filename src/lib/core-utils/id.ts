/**
 * Generates a short, non-cryptographic pseudo-random unique token for client-side ephemeral UI items
 * (such as temporary routine list items or canvas scratch blocks).
 * Safe across all browser environments (HTTP, HTTPS, older webviews, and test runners)
 * where window.crypto.randomUUID might be undefined.
 */
export function generateClientToken(prefix = "id"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}
