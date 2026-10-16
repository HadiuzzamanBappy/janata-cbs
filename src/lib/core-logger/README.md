# 📋 CBS Core Logger (`@/lib/core-logger`)

A security-hardened, isomorphic, structured logging utility designed for the **Janata Core Banking Workbench**.

It automatically redacts sensitive banking credentials (passwords, PINs, auth tokens) and masks customer bank account numbers before any log is written to stdout or the browser console.

---

## 📦 What It Contains

1. **`logger`** (`index.ts`):
   - Priority-based logging: `debug` (0) < `info` (1) < `warn` (2) < `error` (3).
   - Scoped context creation via `logger.withContext("SUBSYSTEM")`.
   - Dual-mode output:
     - **Production Server:** Single-line, machine-readable JSON streamed to `process.stdout` and `process.stderr` (compatible with ELK, Datadog, CloudWatch).
     - **Development & Browser:** Formatted, timestamped, and color-coded console output.
2. **`redactSensitiveData`** (`redact.ts`):
   - Recursively scrubs credential keys (`password`, `token`, `secret`, `pin`, `cvv`, `authorization`, etc.) replacing values with `[REDACTED]`.
   - Automatically masks account numbers (e.g. `AC12345678` -> `AC****5678`).
   - Circular reference protection using `WeakSet` (prevents stack overflows on deep objects).
   - Native JavaScript `Error` serialization (preserves `name`, `message`, and `stack`).

---

## 🚀 How to Use

### 1. Basic Logging

```typescript
import { logger } from "@/lib/core-logger";

logger.info("Application initialized");
logger.warn("Cache miss for menu tree", { key: "MAIN_MENU" });
logger.error("Failed to connect to backend", error);
```

---

### 2. Scoped Child Logger with Context

Recommended for modules, services, and routes:

```typescript
import { logger } from "@/lib/core-logger";

const log = logger.withContext("REDIS");

log.info("Connection established", { host: "127.0.0.1", port: 6379 });
// Output: [2026-10-17T...] [INFO] [REDIS]: Connection established { host: '127.0.0.1', port: 6379 }
```

---

### 3. Automated PII & Credential Masking in Action

You do not need to manually sanitize payloads—the logger handles it automatically:

```typescript
logger.info("Processing user login", {
  username: "teller01",
  password: "super-secret-password", // Automatically redacted
  accountNo: "AC10000000001",         // Automatically masked
});
```

**Logged Output:**
```json
{
  "timestamp": "2026-10-17T01:50:00.000Z",
  "level": "info",
  "message": "Processing user login",
  "data": {
    "username": "teller01",
    "password": "[REDACTED]",
    "accountNo": "AC****0001"
  }
}
```

---

## 🔒 Architectural State: Scalable or Sealed?

### 1. Logger Core (`index.ts`): **SEALED**
Log level priorities, streaming stdout handling, and browser-safe formatting are complete.

### 2. Redaction Patterns (`redact.ts`): **SCALABLE**
If new sensitive fields or account prefixes are introduced by the banking system:
- **Adding Sensitive Keys:** Add regex pattern to `SENSITIVE_KEY_PATTERNS` in `redact.ts`.
- **Adding Account Prefixes:** Update the prefix pattern (e.g. `AC|SB|CD|FD|LN`) in `redact.ts:59`.

---

## 🧪 Verification

Run the test suite verifying redaction and formatting:
```bash
pnpm verify:matrix
```
