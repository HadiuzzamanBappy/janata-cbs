/**
 * Generates a short unique token for client-side ephemeral UI items (multi-value rows, scratch blocks).
 */
export function generateClientToken(prefix = "id"): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
