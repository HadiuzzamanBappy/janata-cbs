/**
 * Generates an RFC 4122 UUIDv4 idempotency key for CBS wire requests.
 * Uses native crypto.randomUUID() when available, with a standard fallback
 * for non-secure contexts (e.g. non-localhost IP over HTTP).
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a short unique token for client-side ephemeral UI items (multi-value rows, scratch blocks).
 */
export function generateClientToken(prefix = "id"): string {
  return `${prefix}_${generateIdempotencyKey().slice(0, 8)}`;
}
