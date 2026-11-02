/**
 * Automated Verification Suite for CBS Core Logger (@/lib/core-logger)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * capability exposed by `@/lib/core-logger` with explicit Input and Output visualization:
 * 1. Account Number Masking (maskAccountNumber: preserves prefix and trailing 4 digits)
 * 2. Sensitive Key Detection (isSensitiveKey: catches passwords, tokens, secrets)
 * 3. Deep Object & Array PII Redaction (redactSensitiveData: recursive sanitation)
 * 4. Circular Reference Safe Handling (prevents infinite recursion)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-core-logger.ts
 */

import { isSensitiveKey, maskAccountNumber, redactSensitiveData } from "@/lib/core-logger";

interface TestCase {
  title: string;
  input: unknown;
  output: unknown;
  passed: boolean;
  error?: string;
}

const testCases: TestCase[] = [];

function recordTest(
  title: string,
  input: unknown,
  output: unknown,
  condition: boolean,
  error?: string,
) {
  testCases.push({ title, input, output, passed: condition, error });
  const statusTag = condition ? "\x1b[32m✔ [PASS]\x1b[0m" : "\x1b[31m✖ [FAIL]\x1b[0m";
  console.log(`\n${statusTag} ${title}`);
  console.log(`       Input  : ${typeof input === "string" ? input : JSON.stringify(input)}`);
  console.log(`       Output : ${typeof output === "string" ? output : JSON.stringify(output)}`);
  if (!condition && error) {
    console.error(`       Error  : ${error}`);
  }
}

async function runSuite() {
  console.log("================================================================================");
  console.log("       CBS CORE LOGGER & PII REDACTION VERIFICATION (@/lib/core-logger)          ");
  console.log("================================================================================");

  // 1. Account Number Masking
  const rawAcct = "AC1234567890123";
  const maskedAcct = maskAccountNumber(rawAcct);
  recordTest(
    "1. Account Masking: Masks 13-digit account numbers preserving prefix and last 4 digits",
    { raw: rawAcct },
    { masked: maskedAcct },
    maskedAcct === "AC****0123",
  );

  // 2. Sensitive Key Detection
  const sensitiveChecks = {
    pass: isSensitiveKey("password"),
    token: isSensitiveKey("authToken"),
    secret: isSensitiveKey("client_secret"),
    title: isSensitiveKey("accountTitle"),
  };
  recordTest(
    "2. Sensitive Key Detection: Identifies security keys while allowing safe business fields",
    { testKeys: ["password", "authToken", "client_secret", "accountTitle"] },
    sensitiveChecks,
    sensitiveChecks.pass &&
      sensitiveChecks.token &&
      sensitiveChecks.secret &&
      !sensitiveChecks.title,
  );

  // 3. Deep Object & Array Redaction
  const sensitivePayload = {
    userId: "USER001",
    password: "CleartextPassword",
    nested: {
      authToken: "jwt-token-12345",
      accountNumber: "AC1234567890123",
    },
    items: [{ secret: "top-secret" }],
  };
  const redacted = redactSensitiveData(sensitivePayload) as Record<string, unknown>;
  const nestedRedacted = redacted.nested as Record<string, unknown>;
  const itemRedacted = (redacted.items as Array<Record<string, unknown>>)[0];
  recordTest(
    "3. Deep Redaction: Sanitizes passwords, tokens, and masks account numbers recursively",
    { originalKeys: Object.keys(sensitivePayload) },
    {
      userId: redacted.userId,
      password: redacted.password,
      nestedToken: nestedRedacted?.authToken,
      nestedAcct: nestedRedacted?.accountNumber,
      itemSecret: itemRedacted?.secret,
    },
    redacted.password === "[REDACTED]" &&
      nestedRedacted?.authToken === "[REDACTED]" &&
      nestedRedacted?.accountNumber === "AC****0123" &&
      itemRedacted?.secret === "[REDACTED]",
  );

  // 4. Circular Reference Interception
  const circularObj: Record<string, unknown> = { name: "Root" };
  circularObj.self = circularObj;
  let circularSafe = false;
  try {
    const resCircular = redactSensitiveData(circularObj) as Record<string, unknown>;
    circularSafe = resCircular.self === "[Circular]";
  } catch {
    circularSafe = false;
  }
  recordTest(
    "4. Circular Reference Safety: Intercepts circular references safely with '[Circular]'",
    { circularStructure: "{ name: 'Root', self: [Circular] }" },
    { circularHandled: circularSafe },
    circularSafe === true,
  );

  // Final Summary
  console.log("\n================================================================================");
  const passedTests = testCases.filter((t) => t.passed).length;
  const failedTests = testCases.filter((t) => !t.passed).length;

  if (failedTests === 0) {
    console.log(
      `\x1b[32m✔ SUCCESS: ALL ${passedTests} CORE LOGGER CAPABILITIES VALIDATED 100% CLEAN!\x1b[0m`,
    );
    console.log(
      "================================================================================\n",
    );
  } else {
    console.error(`\x1b[31m✖ FAILURE: ${failedTests} TESTS FAILED!\x1b[0m`);
    console.log(
      "================================================================================\n",
    );
    process.exit(1);
  }
}

runSuite().catch((err: unknown) => {
  console.error("Fatal Test Suite Crash:", err);
  process.exit(1);
});
