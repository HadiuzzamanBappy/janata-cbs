/**
 * Banking-Grade PII & Sensitive Data Redaction Utility
 * Detects sensitive keys, tokens, credentials, and financial account numbers.
 */

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /bearer/i,
  /confpass/i,
  /pin/i,
  /cvv/i,
  /ssn/i,
  /apikey/i,
  /privatekey/i,
  /creditcard/i,
];

/**
 * Mask account numbers keeping only the last 4 digits (e.g. "AC****1234")
 */
export function maskAccountNumber(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (digits.length >= 8) {
    const prefix = val.slice(0, 2);
    const last4 = digits.slice(-4);
    return `${prefix}****${last4}`;
  }
  return "****";
}

/**
 * Checks if a key matches any known sensitive/credential patterns
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Recursively traverses data to mask sensitive properties and financial account strings
 */
export function redactSensitiveData(data: unknown, seen = new WeakSet()): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    // Check if string explicitly starts with banking account prefixes (e.g., AC12345678, SB12345678)
    if (/^(?:AC|SB|CD|FD|LN|ac|sb|cd|fd|ln)\d{6,14}$/.test(data)) {
      return maskAccountNumber(data);
    }
    return data;
  }

  if (typeof data !== "object") {
    return data;
  }

  // Circular reference guard
  if (seen.has(data)) {
    return "[Circular]";
  }
  seen.add(data);

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
    };
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, seen));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      redacted[key] = "[REDACTED]";
    } else if (/account/i.test(key) && typeof val === "string" && val.length >= 4) {
      redacted[key] = maskAccountNumber(val);
    } else {
      redacted[key] = redactSensitiveData(val, seen);
    }
  }

  return redacted;
}
