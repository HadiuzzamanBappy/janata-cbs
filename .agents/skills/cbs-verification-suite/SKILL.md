---

name: cbs-verification-suite
description: Use this skill when validating code changes, diagnosing regressions, running banking rule tests, or checking layer dependencies and contracts before finalizing a task.
---

# CBS Verification & Triage Runbook

The suite list and what each one covers live in `AGENTS.md` §2. This runbook covers **which** suites to run and **how to triage** a failure.

## 1. Which suites

| You changed                            | Run                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| any import or a new file               | `verify:layers`                                                                 |
| `lib/cbs-access`, action bars          | `verify:access`, `verify:screen`                                                |
| commands, aliases, the registry        | `verify:command`                                                                |
| `lib/cbs-client`, the proxy, `infra-*` | `verify:client`, `verify:grpc`, `verify:redis`, `verify:parsers` + `verify:api` |
| forms, specs, deltas                   | `verify:form-spec`, `verify:record`                                             |
| inquiries                              | `verify:inquiry`                                                                |
| `mock/`                                | `verify:mock`                                                                   |

Always finish with `pnpm lint:fix`, `pnpm typecheck` and `pnpm verify:all`.

## 2. Triage

1. Read the failing case in `scripts/verify/verify-*.ts` (run it alone: `pnpm exec tsx scripts/verify/<file>.ts`).
2. Typical causes: an upward or deep import; a missing enum or schema field in `src/lib/data-schemas`; a rule changed in one place but not its single home.
3. Fix the implementation. Change a suite only when the product contract was intentionally changed, and say so.

## 3. Green is not production proof

The offline suites run against the mock, which simplifies the lifecycle (every mutation goes to `LIVE`) and doesn't enforce Four-Eyes. Before shipping wire, session or proxy changes, also:

- run `pnpm verify:api` against a live core (`DATA_SOURCE=grpc` + a running dev server);
- test by hand: pop out → dock, and sign on as the inputter → Authorize is disabled with the Four-Eyes tooltip.
