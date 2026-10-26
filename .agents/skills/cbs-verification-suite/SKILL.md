---

name: cbs-verification-suite
description: >-
Use this skill when validating code changes, diagnosing regressions, running banking rule tests, or checking layer dependencies and contracts before finalizing a task.
---

# CBS Verification & Testing Runbook

## Overview

Janata CBS maintains an automated verification test harness ensuring banking rules, security models, wire contracts, and utility functions never regress. Always run these test suites to validate your code.

---

## 1. Master Verification Runner

To run the complete verification suite across all domain modules:

```bash
pnpm verify:all
```

This sequentially executes all 7 verification sub-suites:
1. `CBS Access Control & RIDASHL Capabilities` (`@/lib/cbs-access`)
2. `Form Delta Mutation Engine` (`@/lib/cbs-record`)
3. `CBS Command Gateway & Alias Parser` (`@/lib/cbs-command`)
4. `CBS Client Wire Protocol & Payload Factories` (`@/lib/cbs-client`)
5. `Environment Matrix, Schemas & PII Redaction` (`@/lib/data-schemas` & `@/lib/core-logger`)
6. `Core Banking Utilities & Localization` (`@/lib/core-utils`)
7. `Infra Services, Mock Proxies & GRL Fallbacks` (`@/lib/infra-services`)

---

## 2. Granular Diagnostic Commands

When working on a specific feature, run the targeted test to quickly verify your changes:

| Command                | Target Scope      | Key Things Verified                                             |
| :--------------------- | :---------------- | :-------------------------------------------------------------- |
| `pnpm verify:access`   | Access & Security | RIDASHL functions, Four-Eyes principle, Maker-Checker blocking  |
| `pnpm verify:record`   | Record & Forms    | Delta calculation, dirty mutations, INA/AU lifecycle            |
| `pnpm verify:command`  | Command Gateway   | Syntax parsing, comma auto-auth (`USER,`), aliases (`MD`, `UG`) |
| `pnpm verify:client`   | Wire Protocol     | Payload factories (`GET`, `PUT`, `AUT`, `INQ`, `GRL`)           |
| `pnpm verify:utils`    | Core Utils        | Currency formatting (`BDT`), masking (`****`), value dates      |
| `pnpm verify:matrix`   | Env & Matrix      | Wire fixtures, mock parsers, PII redaction                      |
| `pnpm verify:services` | Infra Services    | Mock responses, fallback dispatcher, GRL catalog items          |

---

## 3. TypeScript & Linter Verification

Before concluding any development task:

1. **Verify TypeScript Strictness:**

   ```bash
   pnpm typecheck
   ```

   Must pass with zero errors (`tsc --noEmit` exit code 0). Never ignore types or use `any`.

2. **Verify Biome Formatting & Lints:**

   ```bash
   pnpm lint
   ```

   Or auto-fix via:

   ```bash
   pnpm lint:fix
   ```

---

## 4. Failure Triage Runbook

If a verification test fails:
1. Read the exact test failure output (the test files are in `scripts/verify-*.ts`).
2. Identify whether the regression is due to:
   - A broken layer boundary (e.g. importing a higher layer into `src/lib/`).
   - A missing enum mapping or schema mismatch in `src/lib/data-schemas/`.
   - A Four-Eyes rule bypass.
3. Fix the underlying implementation without altering the test harness unless the product contract was intentionally updated.
