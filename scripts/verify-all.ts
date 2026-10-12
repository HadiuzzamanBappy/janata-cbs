/**
 * Master Verification Suite Runner
 * Runs all library verification scripts in sequence and produces a consolidated report.
 *
 * Usage:
 *   pnpm tsx scripts/verify-all.ts
 */

import { execSync } from "node:child_process";

interface SuiteResult {
  title: string;
  command: string;
  passed: boolean;
  durationMs: number;
}

const SUITES = [
  {
    title: "1. CBS Access Control & RIDASHL Capabilities (@/lib/cbs-access)",
    command: "pnpm exec tsx scripts/verify-cbs-access.ts",
  },
  {
    title: "2. Form Delta Mutation Engine (@/lib/cbs-record)",
    command: "pnpm exec tsx scripts/verify-cbs-record.ts",
  },
  {
    title: "3. CBS Command Gateway & Alias Parser (@/lib/cbs-command)",
    command: "pnpm exec tsx scripts/verify-cbs-command.ts",
  },
  {
    title: "4. CBS Client Wire Protocol & Payload Factories (@/lib/cbs-client)",
    command: "pnpm exec tsx scripts/verify-cbs-client.ts",
  },
  {
    title:
      "5. Environment Matrix, Schemas & PII Redaction (@/lib/data-schemas & @/lib/core-logger)",
    command: "pnpm exec tsx scripts/verify-env-matrix.ts",
  },
  {
    title: "6. Core Banking Utilities & Localization (@/lib/core-utils)",
    command: "pnpm exec tsx scripts/verify-core-utils.ts",
  },
  {
    title: "7. Infra Services, Mock Proxies & GRL Fallbacks (@/lib/infra-services)",
    command: "pnpm exec tsx scripts/verify-infra-services.ts",
  },
];

console.log("\n================================================================================");
console.log("       FINX CBS MASTER VERIFICATION RUNNER                                      ");
console.log("================================================================================\n");

const results: SuiteResult[] = [];

for (const suite of SUITES) {
  process.stdout.write(`Executing: ${suite.title}... `);
  const start = Date.now();

  try {
    execSync(suite.command, {
      stdio: "pipe",
      cwd: process.cwd(),
      encoding: "utf-8",
    });
    const duration = Date.now() - start;
    console.log(`[PASS] (${duration}ms)`);
    results.push({
      title: suite.title,
      command: suite.command,
      passed: true,
      durationMs: duration,
    });
  } catch (err: unknown) {
    const duration = Date.now() - start;
    console.log(`[FAIL] (${duration}ms)`);
    const execErr = err as { stdout?: string | Buffer; stderr?: string | Buffer; message?: string };
    if (execErr.stdout) console.log(String(execErr.stdout));
    if (execErr.stderr) console.error(String(execErr.stderr));
    if (!execErr.stdout && !execErr.stderr && execErr.message) console.error(execErr.message);
    results.push({
      title: suite.title,
      command: suite.command,
      passed: false,
      durationMs: duration,
    });
  }
}

console.log("\n================================================================================");
console.log("                           CONSOLIDATED SUMMARY                                 ");
console.log("================================================================================");

let allPassed = true;
for (const r of results) {
  const status = r.passed ? "[PASS]" : "[FAIL]";
  console.log(`${status.padEnd(8)} ${r.title.padEnd(65)} (${r.durationMs}ms)`);
  if (!r.passed) allPassed = false;
}

console.log("================================================================================\n");

if (allPassed) {
  console.log(">>> SUCCESS: ALL CBS LIBRARIES AND PERMUTATIONS VALIDATED 100% CLEAN! <<<\n");
  process.exit(0);
} else {
  console.error(">>> FAILURE: ONE OR MORE SUITES FAILED VALIDATION! <<<\n");
  process.exit(1);
}
