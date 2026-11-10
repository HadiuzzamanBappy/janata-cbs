/**
 * Generates a short unique token for client-side ephemeral UI items (multi-value rows, scratch blocks).
 */
export function generateClientToken(prefix = "id"): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Generates a RFC 4122 UUIDv4 idempotency key for CBS wire requests.
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}
