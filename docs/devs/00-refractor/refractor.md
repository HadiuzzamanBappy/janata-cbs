# Master Refactoring Audit Plan (Leaves → Root)

> [!NOTE]
> **Baseline measured on 2026-11-17, branch `feat/refractor` @ `19ab87e`.** Every finding below cites a real file and line from that snapshot. Line numbers drift as work proceeds, so re-run the evidence command (in the _Evidence_ column) before acting on a finding.

This plan runs strictly from dependency leaves to root. A phase may only change files in its own layer plus the **call sites** that consume what it changed, and a lower phase is never reopened after its exit gate passes. The layer ranks are the ones enforced by [verify-layers.ts](../../../scripts/verify/verify-layers.ts) (`types`/`data-schemas` L0 → … → `app` L6).

---

## Baseline Health

| Gate                 | Result                                                                                              | Notes                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`     | ✅ 0 errors                                                                                         |                                                                                                                         |
| `pnpm verify:all`    | ✅ 16 / 16 suites pass                                                                              | `verify:api` (live) not run                                                                                             |
| `pnpm lint`          | ❌ **320 errors**                                                                                   | **All of them are CRLF line endings** (see P0-1). `biome lint` alone gives 0 errors and 1 warning (a raw JSON fixture). |
| Size                 | 471 TS/TSX files, ~55k lines                                                                        | `features/system` = **16.6k lines (30%)**; `form-config` alone = 8.0k                                                   |
| Over the size budget | 10 source files + 5 mock tables                                                                     | See Phase 5/6 tables                                                                                                    |
| Dead exports         | 54 never referenced, 19 used only by `scripts/verify`, 310 exported but used only in their own file | Static scan; confirm each by hand before deleting (see [Appendix A](#appendix-a-dead-export-inventory))                 |

---

## Phase 0 — Governance & Tooling (prerequisite, no runtime code)

> [!NOTE]
> **Status: ✅ complete (2026-11-17).** The outcome of each item is recorded in the [Phase 0 outcome](#phase-0-outcome) table below the exit gate.

The gates themselves have to be trustworthy before any refactor. Before Phase 0, `pnpm lint:fix` would have rewritten **every file** in the repo.

| ID   | Red flag                                                                                                                                                                                                                                                                   | Action                                                                                                                                                                                                           |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-1 | [biome.json](../../../biome.json) sets `lineEnding: "lf"`, but there is no `.gitattributes` and the Windows checkouts use `core.autocrlf=true`. The result is CRLF everywhere and 320 false "format" errors.                                                               | Add `.gitattributes` with `* text=auto eol=lf`, then do a **single isolated commit** of `git add --renormalize .`. No other change goes in that commit, so reviewers can ignore it via `.git-blame-ignore-revs`. |
| P0-2 | Biome `noRestrictedImports` messages cite **"CLAUDE.md §2"**, which does not exist.                                                                                                                                                                                        | Point the messages at `AGENTS.md §3` / `.agents/rules/01-architecture-layers.md`.                                                                                                                                |
| P0-3 | **The rules contradict each other on control height.** The `cbs-compact-ui-and-layout` skill says `h-8` (table rows 25–29 and checklist line 157); `AGENTS.md §3.6`, `rules/04` and `README.md` say `h-9`.                                                                 | **Decision needed (owner: UI lead).** Pick one value, fix the other three documents, and Phase 5 enforces it.                                                                                                    |
| P0-4 | [docs/devs/README.md](../README.md) links to **23 pages that were deleted** (`01-architecture/*`, `02-core-engine/*`, …). [README.md](../../../README.md)'s directory tree lists `features/command`, `features/settings` and `components/cbs-access`, none of which exist. | Restore or remove each sitemap entry. Regenerate the README tree from [PROJECT_TREE.md](../PROJECT_TREE.md).                                                                                                     |
| P0-5 | `verify:layers` checks feature/component barrels but **not `@/lib/*` or `@/store/*` barrels**, so 75 deep imports pass silently (see F1-7).                                                                                                                                | Extend the barrel rule to `lib/*` and `store` (allowlist only `core-config/server` and `infra-grpc/generated`). Land the rule in Phase 1 together with the fixes.                                                |

**Exit gate P0:** `pnpm lint` passes with 0 errors on a clean checkout, `git diff --stat` after `pnpm lint:fix` is empty, and P0-3 is decided and written down.

### Phase 0 outcome

| ID   | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-1 | ✅ Added [.gitattributes](../../../.gitattributes) (`* text=auto eol=lf`, plus binary patterns). **Correction to the original plan:** the git index already stored every file as LF (`git ls-files --eol`: 579 `i/lf`, 0 `i/crlf`). The CRLF existed only in Windows working trees, so a `--renormalize` commit would have been empty and no `.git-blame-ignore-revs` is needed. The 333 CRLF working files were converted in place, and their blob hashes match the index.                                                                                                                                                            |
| P0-2 | ✅ All 6 Biome `noRestrictedImports` messages now cite `.agents/rules/01-architecture-layers.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| P0-3 | ✅ **Decided: `h-8`**, which matches the existing `Input`/`Select`/`Button` primitives and the UI skill. Updated `AGENTS.md §3.6`, `rules/00`, `rules/04`, `README.md`, the `cbs-form-and-record-lifecycle` skill and `PROJECT_STUDY_PLAN.md`. Aligning the code is still F5-5.                                                                                                                                                                                                                                                                                                                                                        |
| P0-4 | ✅ Every developer-portal page under `01-…`–`05-…` and all 3 manual pages had been **deliberately deleted** in `f256f3f` (2026-10-26) and earlier commits, and they described pre-refactor architecture. So I **removed** the dead entries instead of restoring them. This covers both sitemaps and the in-app nav (`DEV_NAV_GROUPS`/`MANUAL_NAV_GROUPS` in [config.ts](../../../src/features/docs/config.ts), which had 25 dead links). The root README tree was replaced with an accurate summary that links to `PROJECT_TREE.md`. `PROJECT_TREE.md` itself had its 21 broken `file:///d:/Work/…` links and three stale facts fixed. |
| P0-5 | ⏭ Deferred to Phase 1 as planned: enabling the rule now would fail `verify:layers` with 75 violations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| P0-6 | ✅ **Found during Phase 0.** `pnpm fixture:clean` read from `mock/.response/`, which no longer exists, and Biome's exclude `!**/.response` matched nothing, which caused the 1 lint warning. Both now point at `mock/db/.rawResponse/`.                                                                                                                                                                                                                                                                                                                                                                                                |

**Gate results:** `pnpm lint` passes (0 errors, 0 warnings), `pnpm lint:fix` produces no changes, `pnpm typecheck` passes, and `pnpm verify:all` passes 16/16. All nav, sitemap and cross-reference links resolve to files on disk.

---

## Phase 1 — Canonical Types, Zod Schemas, Constants & Enums (L0)

**Scope:** [src/types/](../../../src/types/) (329 lines) and [src/lib/data-schemas/](../../../src/lib/data-schemas/) (1,164 lines). This phase also moves vocabulary that currently lives too high (in L2/L3) **down** into L0.

### Red flags

| ID   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                      | Evidence                                                                           |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| F1-1 | **The API status enum has no effect.** `apiResponseSchema.status` is `z.enum(API_STATUSES).or(z.string())`, so any string validates. On top of that, the response carries a **second success flag**, `success?: boolean`, which the proxy route sets (`{ ...response, success: true }`) and consumers OR together (`res.status === "SUCCESS" \|\| res.success`).                                                                             | [common-schema.ts:93-103](../../../src/lib/data-schemas/common-schema.ts#L93-L103) |
| F1-2 | **The inquiry step union `"SELECTION" \| "RESULTS"` is redefined in 7 places**, and the literals appear in 20+ expressions.                                                                                                                                                                                                                                                                                                                  | `grep -rn '"SELECTION" \| "RESULTS"' src`                                          |
| F1-3 | **The inquiry tab-state shape is declared 4 times**: `workbench-store.ts:22`, `CommandInquiryState` (`cbs-command/types.ts:32`), the inline type in `screen/[id]/page.tsx:126`, and `FilterCriteriaMap` (`cbs-inquiry-spec/criteria-mapper.ts:8`). The copies have drifted, which forces `as unknown as FilterCriteriaMap` (`use-inquiry-state.ts:26`).                                                                                      | `grep -rn "operand: string }" src`                                                 |
| F1-4 | `CBS_COMPONENT` names (`DYNAMIC_FORM`, `INQUIRY_SCREEN`) live in L2 (`cbs-command/types.ts:11`), but L6 hardcodes the literals instead (`screen/[id]/page.tsx:118,164,244`).                                                                                                                                                                                                                                                                 | `grep -rn '"DYNAMIC_FORM"' src`                                                    |
| F1-5 | Record-status literals bypass the enum: `"AU"` appears in `audit-container.tsx:34` and `form-preview.tsx:86`, and `cbs-inquiry-spec/constants.ts:27-31` **hand-copies a status option list** while the canonical `CBS_RECORD_STATUS_DEFINITIONS` (`types/status.ts:33`, which already has `label`) is **referenced nowhere**.                                                                                                                | `grep -rn 'CBS_RECORD_STATUS_DEFINITIONS' src`                                     |
| F1-6 | Dead or redundant L0 exports: `CbsRecordStatusCode` (a pure alias of `CbsRecordLifecycleStatus`), `UpdateBranchSessionInput`, `ControlAction`, `FormRoutine`, `RoutineItem`, `IdDef`, `MENU_ACTIONS`, `MENU_TYPES`, `menuTreeNodeSchema`, six `*WidgetConfig`/`FieldConditionOperator`/`FormOnChangeRule`/`ParameterOptionItem` types, and `inquiryExecuteOptionsSchema`. `inquiryRowSchema` is also unused, but F2-1 reuses it, so keep it. | Appendix A                                                                         |
| F1-7 | **Barrel bypass: 71 deep imports** into data-schemas files (`form-engine-schema` ×32, `menu-designer-schema` ×19, `inquiry-config-schema` ×9, `model-config-schema` ×6, …), plus 4 more: `@/store/session/session-provider` ×2 (`ops-inquiry.tsx:15`), `@/lib/cbs-screen/types` and `@/lib/core-utils/export`.                                                                                                                               | `grep -rEoh 'from "@/lib/data-schemas/[a-z-]+"' src \| sort \| uniq -c`            |
| F1-8 | The public surface is too wide: 18 exports in `form-engine-schema.ts` and 9 in `inquiry-config-schema.ts` are used only inside their own file. `form-engine-schema.ts` is also over budget (328 lines).                                                                                                                                                                                                                                      | Appendix A                                                                         |

### Before → after

```ts
// BEFORE — common-schema.ts. The enum is bypassed, and there are two success signals.
status: z.enum(API_STATUSES).or(z.string()),
success: z.boolean().optional(),
// …20 files: if (res.status === "SUCCESS" || res.success) {…}

// AFTER — single authoritative status + predicate (L0)
export const CBS_API_STATUS = { SUCCESS: "SUCCESS", FAIL: "FAIL", ERROR: "ERROR",
  RECORD_NOT_FOUND: "RECORD_NOT_FOUND", RETRY: "RETRY" } as const;
export const apiResponseSchema = z.object({ status: z.enum(CBS_API_STATUS), /* no `success` */ … });
export const isApiSuccess = (r: Pick<ApiResponse, "status">): boolean =>
  r.status === CBS_API_STATUS.SUCCESS;
```

> [!IMPORTANT]
> Before tightening `status` to a strict enum, capture every status the live core actually returns. Use `verify:api` together with a temporary log at the proxy. If the core emits any other value, add it to the enum; don't keep `.or(z.string())`.

```ts
// BEFORE — 4 divergent shapes + cast
inquiryState?: { step?: "SELECTION" | "RESULTS"; criteria?: Record<string, { value: string; operand: string }>; … }
return currentTab.inquiryState.criteria as unknown as FilterCriteriaMap;

// AFTER — src/types/screen.ts (L0), consumed by store, cbs-command, cbs-screen, cbs-inquiry-spec, app
export const CBS_INQUIRY_STEP = { SELECTION: "SELECTION", RESULTS: "RESULTS" } as const;
export type CbsInquiryStep = (typeof CBS_INQUIRY_STEP)[keyof typeof CBS_INQUIRY_STEP];
export interface CbsFilterCriterion { readonly value: string; readonly operand: SelectionOperand }
export type CbsFilterCriteriaMap = Readonly<Record<string, CbsFilterCriterion>>;
export interface CbsInquiryTabState { step?: CbsInquiryStep; criteria?: CbsFilterCriteriaMap;
  currentPage?: number; pageSize?: number }
// + CBS_SCREEN_COMPONENT moved here from lib/cbs-command/types.ts
```

### Exit gate P1

- [x] `grep -rn '"SELECTION"\|"RESULTS"\|"DYNAMIC_FORM"\|"INQUIRY_SCREEN"' src` matches only `src/types/`.
- [x] `grep -rn 'success: true\|\.success)' src` finds no ApiResponse success flag.
- [x] Status option lists are derived from `CBS_RECORD_STATUS_DEFINITIONS`, with zero hand-copied lists.
- [x] 0 deep `@/lib/data-schemas/*` imports, and the extended P0-5 barrel rule is active in `verify:layers`.
- [x] `pnpm typecheck` · `pnpm lint` · `pnpm verify:schemas` · `pnpm verify:layers` · `pnpm verify:all` all green.

### Phase 1 outcome

> [!NOTE]
> **Status: ✅ complete (2026-11-17).** Gates: lint 0 errors / 0 warnings, typecheck 0 errors, `verify:all` 16/16. `verify:api` (live core) was **not** run; see F1-1.

| ID   | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1-1 | ✅ `CBS_API_STATUS`, `apiStatusSchema` and the single `isApiSuccess()` predicate live in [common-schema.ts](../../../src/lib/data-schemas/common-schema.ts). `status` is now a strict enum, and the `success` flag is gone from the schema, from the BFF helpers, the proxy route and the mock factory, and from its 4 consumers. **Live-core safety:** the core's status string is validated once, at the trust boundary in [dispatch.ts](../../../src/lib/infra-grpc/dispatch.ts) (`resolveCoreStatus`). An unrecognised value is logged at `error` level and surfaced as `ERROR`, never as success, which matches how every consumer already treated non-`SUCCESS` values. Run `verify:api` against the live core and check the logs for "unrecognised status". The remaining `"SUCCESS"` literals at call sites are still F3-1. |
| F1-2 | ✅ `CBS_INQUIRY_STEP` / `CbsInquiryStep` in [types/screen.ts](../../../src/types/screen.ts) replace the 7 hand-written unions and all literals.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| F1-3 | ✅ `FilterCriterion`, `FilterCriteriaMap` and `InquiryTabState` now have one definition, in [inquiry-config-schema.ts](../../../src/lib/data-schemas/inquiry-config-schema.ts), next to `SelectionOperand`. The workbench store, the command gateway, the screen types and the popup route all use it. Both casts (`as unknown as FilterCriteriaMap` and `as CommandInquiryState`) are gone, and so is `CommandInquiryState`. The `SelectionOperand` re-export from `cbs-inquiry-spec` was also removed.                                                                                                                                                                                                                                                                                                                            |
| F1-4 | ✅ `CBS_SCREEN_COMPONENTS` moved to L0, and the popup route uses it instead of literals.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| F1-5 | ✅ The inquiry status filter options and the audit-field status legend are both derived from `CBS_RECORD_STATUS_DEFINITIONS` (excluding the client-only `NEW`). **This changes visible behaviour:** the dead `LIVE` option (not a valid record status; the record schema rejects it, and no data uses it) is gone, `REV` is now filterable, and labels follow the canonical definitions (e.g. "Pending Approval (UA)"). The legend's non-existent `INAU`/`RNAU` codes were replaced. The `"AU"` literals now use `CbsRecordStatus.AU`.                                                                                                                                                                                                                                                                                              |
| F1-6 | ✅ Deleted 17 dead L0 exports, plus the `MenuTreeNode`/`menuTreeNodeSchema` aliases of `MenuItem` (11 files migrated) and the unused domain-type re-export block in `components/cbs-menu`. `inquiryRowSchema` and `CBS_RECORD_STATUS_DEFINITIONS` were kept: F1-5 already revives the definitions, and F2-1 will revive the row schema.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| F1-7 | ✅ 71 deep `@/lib/data-schemas/*` imports were rewritten to the barrel and merged into one import per file. The other deep `lib`/`store`/`hooks` imports (6) were fixed too. `verify:layers` now treats `lib/*`, `store` and `hooks` as barrel units (`<unit>/server.ts` stays a public entry). A probe file confirmed it rejects deep imports. The rule doc `rules/01` was updated to match.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| F1-8 | ✅ 51 self-only L0 symbols are now module-private. `inquiryCriteriaParamSchema` became fully dead and was removed. `form-engine-schema.ts` (321 lines) was split into [form-widget-schema.ts](../../../src/lib/data-schemas/form-widget-schema.ts) (126 lines: widget types, compatibility matrix and widget configs, exposed as one `formWidgetShape`) and `form-engine-schema.ts` (207 lines). The element schema's key order and inferred type are unchanged.                                                                                                                                                                                                                                                                                                                                                                    |

---

## Phase 2 — Pure Utilities, Parsers, Serializers & Redaction (L1–L2 pure)

**Scope:** [data-parsers/](../../../src/lib/data-parsers/) (1,143 lines), [core-utils/](../../../src/lib/core-utils/), [core-logger/](../../../src/lib/core-logger/), [cbs-inquiry-spec/](../../../src/lib/cbs-inquiry-spec/) (its serializers).

### Red flags

| ID   | Finding                                                                                                                                                                                                                                       | Evidence                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| F2-1 | **Inquiry rows are parsed twice.** The proxy already runs `parseInquiryRecords` for `INQ`, and the client runs it again in `ops-inquiry.tsx:86` and `inquiry-preview.tsx:96`.                                                                 | [route.ts:101-106](../../../src/app/api/proxy/route.ts#L101-L106) |
| F2-2 | **Protobuf is decoded twice** on the cached path: once inside the cache fetcher (`route.ts:89`) and again on the way out (`route.ts:105`).                                                                                                    | same file                                                         |
| F2-3 | **The sanitizers are partial**: `sanitizeFormConfigRecord(record?) → T \| undefined`. This breeds fallback wrappers like `(sanitizeInquiryConfigRecord(formData) \|\| formData) as unknown as Record<…>` (`use-ic-actions.ts:56`).            | `grep -rn 'Record(.*)                                             |     | ' src` |
| F2-4 | `inquiry-preview.tsx:48` and `:151` rebuild default criteria inline instead of calling the canonical `buildDefaultCriteria` (`criteria-mapper.ts:13`).                                                                                        |                                                                   |
| F2-5 | **Storage access is not centralised: 26 raw `localStorage`/`sessionStorage` calls in 9 files**, each with its own `try { } catch { /* Safe fallback */ }`.                                                                                    | `grep -rln 'Storage\.\(get\|set\|remove\)Item' src`               |
| F2-6 | Logging is bypassed: 7 `console.*` calls outside `core-logger` (`inquiry-preview.tsx:108`, `cbs-form-header.tsx:152`, `use-record-lookup.ts:73,108`, `ops-inquiry.tsx:99`, `loader.tsx:31`, `workbench-bus.ts:67`). These skip PII redaction. | `grep -rn 'console\.' src \| grep -v core-logger`                 |
| F2-7 | Non-deterministic ID: `mermaid-diagram.tsx:15` uses `Math.random()`. Use `React.useId()`. (The `Math.random` in `core-utils/id.ts` is a documented RFC-4122 fallback for non-secure contexts, which is acceptable.)                           |                                                                   |
| F2-8 | Dead or test-only parsers: `parseMenuTreeList` (dead); `parseModelConfig` and `sanitizeUserSession` (used only by `scripts/verify`). `inquiry-config-parser.ts` (317 lines) and `form-config-parser.ts` (256) are over budget.                | Appendix A                                                        |

### Before → after

```ts
// BEFORE — client re-parses what the BFF already parsed
const dataset = parseInquiryRecords(queryRes.data);

// AFTER — BFF is the single parse point; client only validates the contract
const res = await cbs.send<InquiryRow[]>(payload, { responseSchema: z.array(inquiryRowSchema) });
setFilteredRows(res.data ?? []);
```

```ts
// AFTER — src/lib/core-utils/storage.ts (one try/catch for the whole app)
export const cbsStorage = {
  read<T>(area: "local" | "session", key: string, schema: z.ZodType<T>): T | null { … safeParse … },
  write(area: "local" | "session", key: string, value: unknown): void { … },
  remove(area: "local" | "session", key: string): void { … },
};
```

### Exit gate P2

- [ ] `parseInquiryRecords` and `decodeProtobufValue` each have **exactly one call site**, both in the BFF.
- [ ] Every `sanitize*Record` has the signature `(r: T) => T`, and there are zero `sanitize…(x) || x` expressions.
- [ ] Raw `*Storage.*Item` calls appear only in `core-utils/storage.ts`, and there are 0 `console.*` calls outside `core-logger`.
- [ ] `pnpm verify:parsers` · `verify:utils` · `verify:logger` · `verify:inquiry` · `verify:all` all green.

---

## Phase 3 — Core & Infrastructure: Wire Factories, Proxy, gRPC, Redis, Mock

**Scope:** [cbs-client/](../../../src/lib/cbs-client/) (968 lines), [infra-grpc/](../../../src/lib/infra-grpc/), [infra-redis/](../../../src/lib/infra-redis/) (702 lines), [core-config/](../../../src/lib/core-config/), [mock/](../../../mock/).

### Red flags

| ID   | Finding                                                                                                                                                                                                                                                                                                                                         | Evidence                                                                                                                           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| F3-1 | **Three competing definitions of success.** `response-handler.ts:20` uses `status === "SUCCESS" \|\| statusCode 200/201`. `proxy-client.ts:76` uses `res.ok && status === "SUCCESS"`. `use-login.ts:42` uses `!data.success`. There are 33 `"SUCCESS"` literals across 24 files.                                                                | `grep -rn '"SUCCESS"' src`                                                                                                         |
| F3-2 | **Auth bypasses the wire client.** `use-login.ts:34` and `use-change-password.ts:37,82` call raw `fetch`, even though `cbsAuth` already exists (it is used for `getSession`).                                                                                                                                                                   | `grep -rn '\bfetch(' src \| grep -v lib/`                                                                                          |
| F3-3 | **A dead-but-dangerous fallback arm in the proxy**: `getOrSet(…) ?? failedResponse ?? await dispatch(…)`. `getOrSet` coalesces concurrent misses through `singleFlight`, so only the _first_ caller's closure ever sets `failedResponse`. Every concurrent follower therefore falls through to a **second `dispatch`** whenever the core fails. | [route.ts:77-96](../../../src/app/api/proxy/route.ts#L77-L96), [cache.ts:181-200](../../../src/lib/infra-redis/cache.ts#L181-L200) |
| F3-4 | **Errors are notified twice.** `proxy-client.ts:101` already calls `notifyError` on network failure and then rethrows, and the designer `catch` blocks toast again (e.g. `use-md-actions.ts:62-67`).                                                                                                                                            |                                                                                                                                    |
| F3-5 | **Payload factories aren't generic**, which forces `x as unknown as Record<string, unknown>` at every save (`use-md-actions.ts:46`, `use-mc-actions.ts:100`, `use-ic-actions.ts:56`).                                                                                                                                                           |                                                                                                                                    |
| F3-6 | Dead or test-only infra exports: `getServices`, `ServerConfig`, `ClientConfig` (dead); `getService`, `isFinancialRequest`, `singleFlight`, `resetCircuit`, `CommandTabPayload` (only used by tests).                                                                                                                                            | Appendix A                                                                                                                         |
| F3-7 | Mock legacy: there's a "Legacy alias for backwards compatibility" in `mock/core/handlers/auth-handlers.ts:82`, plus 15 unused `*_LIST` table exports, `queryCbsDatabase`, `getMockInquiryPayload`, and `CBS_MAIN_NAV_TREE`. `infra-redis/session.ts` is 272 lines.                                                                              | Appendix A                                                                                                                         |

### Before → after

```ts
// BEFORE — proxy route
const response = cacheDesc
  ? ((await getOrSet(key, fetcher, ttl)) ?? failedResponse ?? (await dispatch(envelope, token)))
  : await dispatch(envelope, token);
// …later: decodeProtobufValue(response.data) again

// AFTER — one dispatch, one decode; failures are never cached and never re-dispatched
const run = async () => normalizeDispatch(await dispatch(envelope, token)); // decode + INQ parse once
const response = cacheDesc ? await getOrSetResult(cacheDesc.key, run, cacheDesc.ttl) : await run();
// getOrSetResult caches only isApiSuccess(result); followers in singleFlight receive the same result object
```

```ts
// BEFORE — every caller re-checks, and the catch block toasts twice
const json = await sendMutation(cbs.menuTree.save(wire as unknown as Record<string, unknown>, …), …);
if (json.status === "SUCCESS") { … }   } catch (err) { toast.add({ … }) }

// AFTER — transport returns a discriminated result, and notification lives in the transport only
const result = await sendMutation(cbs.menuTree.save(wire, …), …);   // save<T extends object>
if (result.ok) { … }                                                 // no catch-toast at call sites
```

### Exit gate P3

- [ ] `"SUCCESS"` appears only in `CBS_API_STATUS`, and `isApiSuccess` is the single predicate in use.
- [ ] 0 raw `fetch(` outside `lib/cbs-client/transport` and `lib/infra-*`.
- [ ] A new `verify:grpc` case: N concurrent identical reads against a failing mock produce **exactly 1 dispatch**.
- [ ] A new `verify:client` case: a network failure triggers exactly one notification.
- [ ] 0 `as unknown as` at payload-factory call sites.
- [ ] `pnpm verify:client` · `verify:grpc` · `verify:redis` · `verify:config` · `verify:mock` · `verify:all` all green, and `verify:api` is green against the live core.

---

## Phase 4 — Domain Logic & State: Command Gateway, RIDASHL, Stores, Hooks (L2–L3.5)

**Scope:** [cbs-access/](../../../src/lib/cbs-access/), [cbs-command/](../../../src/lib/cbs-command/) (911 lines), [cbs-screen/](../../../src/lib/cbs-screen/) (788 lines), [cbs-record/](../../../src/lib/cbs-record/), [store/](../../../src/store/) (700 lines), [hooks/](../../../src/hooks/) (402 lines).

### Red flags

| ID   | Finding                                                                                                                                                                                                                                                                                                                                                                                       | Evidence                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| F4-1 | **The `isReadOnly` derivation is duplicated in 4 designers**: `mode !== CbsRecordFunction.INPUT` appears in `sys-form-config.tsx:70`, `sys-inquiry-config.tsx:49`, `sys-menu-designer.tsx:47` and `sys-model-config.tsx:60`. This is literally the example the AGENTS.md §1.1 DRY rule gives; the canonical version is [record-guard.ts:61](../../../src/lib/cbs-access/record-guard.ts#L61). | `grep -rn 'const isReadOnly' src` |
| F4-2 | **Popup drafts bypass their canonical writer.** `cbs-command/executor/popup.ts:41,47` writes drafts and criteria with raw `sessionStorage.setItem`, while `setWorkbenchDraft` and `clearWorkbenchDraft` (`workbench-bus.ts:62,87`) are **never called**. Drafts of up to about 1,000 fields are therefore **never cleared**, and the popup reads criteria with an unvalidated `JSON.parse`.   | `grep -rn 'WorkbenchDraft' src`   |
| F4-3 | **Store provider boilerplate is repeated 3 times**: context + `useRef` + overloaded hook + `state as unknown as T`, in `alert-provider.tsx:33`, `session-provider.tsx:74` and `workbench-provider.tsx:120`. The `getActiveSessionStore` and `getActiveWorkbenchStore` module-global escape hatches are dead.                                                                                  |                                   |
| F4-4 | **The activity heartbeat is duplicated.** `screen/[id]/page.tsx:78-105` and `use-idle-timeout.ts:72-90` implement the same throttled `lastActivity` writer against the same key.                                                                                                                                                                                                              |                                   |
| F4-5 | `cbs-screen/action-bar.ts:77` computes its own `isReadOnly = isSee \|\| isAuth`. Fold it into the `cbs-access` capability result so that only one function answers "can this user edit".                                                                                                                                                                                                      |                                   |

> [!NOTE]
> Compliant, so no action: the `router.push`/`replace` calls (9) are all auth or docs redirects driven by `clientConfig.routes`, and none of them switches between banking screens. The `Date.now()` calls (17) are all timing, TTL or deadline arithmetic, never IDs; the only exception is a mock token, which is acceptable.

### Before → after

```ts
// BEFORE — ×4 designers
const isReadOnly = mode !== CbsRecordFunction.INPUT;

// AFTER — @/lib/cbs-access (pure), consumed via the existing useCbsAccess hook
export const isRecordEditable = (mode: CbsScreenMode): boolean => mode === CbsRecordFunction.INPUT;
const { isReadOnly } = useCbsAccess({ mode, record }); // same answer Four-Eyes/RIDASHL already gives
```

```ts
// AFTER — src/store/create-scoped-store.tsx: one factory, one typed selector, no cast in each store
export function createScopedStore<S>(name: string, init: (seed: Partial<S>) => StoreApi<S>) {
  const Ctx = createContext<StoreApi<S> | null>(null);
  function Provider(props: { seed?: Partial<S>; children: React.ReactNode }) { … }
  function use<T = S>(selector: (s: S) => T = identity as (s: S) => T): T { … }
  return { Provider, use } as const;
}
```

### Exit gate P4

- [ ] `grep -rn 'mode !== CbsRecordFunction.INPUT' src/features` returns 0 results.
- [ ] `popup.ts` uses `setWorkbenchDraft`, and every draft is cleared when its popup docks or closes. A new `verify:screen` case covers this.
- [ ] The 3 stores are built with `createScopedStore`, and there are 0 `as unknown as T` in `src/store`.
- [ ] `pnpm verify:access` · `verify:command` · `verify:record` · `verify:screen` · `verify:all` all green.

---

## Phase 5 — UI Primitives & Design System (L4)

**Scope:** [components/ui/](../../../src/components/ui/) (3,688 lines), [layout/](../../../src/components/layout/), [cbs-screen/](../../../src/components/cbs-screen/) (2,686 lines), [cbs-settings/](../../../src/components/cbs-settings/), [globals.css](../../../src/app/globals.css).

### Red flags

| ID   | Finding                                                                                                                                                                                                                                                                                                 | Evidence                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| F5-1 | **228 arbitrary font sizes in 8 distinct values.** The skill sanctions `text-[11px]` (90) and `text-[10px]` (86). The remaining 52 are off scale: `text-[9px]` (36), `text-[8px]` (6), `11.5px` (3), `0.8rem` (3), `10.5px` (2) and `13px` (2). 8–9px text is not legible on 1366×768 branch terminals. | `grep -rEoh 'text-\[[0-9.]+(px\|rem)\]' src \| sort \| uniq -c` |
| F5-2 | **Two `ChangePassword` implementations**: `components/cbs-settings/components/security-tab.tsx:13` (`useIdempotentSend` + `cbs`) and `features/auth/components/change-password.tsx:156` (raw-`fetch` hook). They have separate validation and messaging.                                                |                                                                 |
| F5-3 | `cbs-form-header.tsx` is 307 lines, so it's over budget. Dead primitives: `DatePicker` (`ui/date-picker.tsx`), `SettingsTabItem`, `mapMenuItemToTreeNode` (`cbs-menu/utils.ts`).                                                                                                                        | Appendix A                                                      |
| F5-4 | **Six `biome-ignore lint/a11y` suppressions** on canvas "selectable" divs across 5 form-config files. They are the same pattern each time, and none has keyboard support.                                                                                                                               | `grep -rn 'biome-ignore' src`                                   |
| F5-5 | Control height: P0-3 chose **`h-8`**, but form controls across the app currently use `h-7` (76), `h-8` (32), `h-9` (14) and `h-10` (12), and `date-picker.tsx` uses `h-9`.                                                                                                                              |                                                                 |

### Before → after

```css
/* AFTER — globals.css @theme: name the sanctioned sizes once */
@theme {
  --text-2xs: 0.6875rem; /* 11px: field labels, dense cells */
  --text-3xs: 0.625rem; /* 10px: status badges, meta */
}
```

```tsx
// BEFORE ×228                                    // AFTER (codemod + skill table updated)
<label className="text-[11px] font-medium …">    <label className="text-2xs font-medium …">
<span className="text-[9px] …">                  <span className="text-3xs …">   {/* 9px/8px retired */}
```

```tsx
// AFTER — one keyboard-accessible primitive replaces all six suppressions
export function SelectableBlock({ selected, onSelect, ...rest }: SelectableBlockProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
      {...rest}
    />
  );
}
```

For F5-2, keep **one** `ChangePasswordForm` in L4 (`components/cbs-settings`), built on the `cbsAuth.changePassword` method added in F3-2. The `/change-password` auth page then composes it and adds only its redirect behaviour.

### Exit gate P5

- [ ] 0 `text-[…px]` remain, and the skill table (`cbs-compact-ui-and-layout`) references the tokens.
- [ ] There is a single `ChangePassword` implementation, and 0 `biome-ignore lint/a11y` remain.
- [ ] Every primitive matches the P0-3 control height.
- [ ] Visual check of the dashboard, a dynamic form and an inquiry at **1366×768 and 1920×1080**, in light and dark.
- [ ] `pnpm typecheck` · `pnpm lint` · `verify:layers` · `verify:all` all green.

---

## Phase 6 — Feature Modules & Engines (L4 engines + L5 features)

**Scope:** [cbs-form-engine/](../../../src/components/cbs-form-engine/) (3,438 lines), [cbs-inquiry-engine/](../../../src/components/cbs-inquiry-engine/) (1,642), [features/operations/](../../../src/features/operations/) (1,298), [features/system/](../../../src/features/system/) (**16,578**), [features/workbench/](../../../src/features/workbench/).

### Red flags

| ID   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Evidence                                        |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| F6-1 | **The four designers (FC, IC, MD, MC) each re-implement the same record lifecycle**: `use-<x>.ts` holds loading, submitting, validationErrors, `fetchRecord`, `initDraft` and `handleValidate`; `use-<x>-actions.ts` holds submit, try/catch, toast, rebaseline, invalidate and reset. Together that's about 1,000 lines of parallel orchestration (`use-model-config.ts` 196, `use-form-config.ts` 191, `use-inquiry-config.ts` 188, `use-menu-designer.ts` 171, plus the `*-actions` 112–167 each). Persistence is already shared (`useCbsPersistence`); the lifecycle is not. | `wc -l src/features/system/*/hooks/use-*.ts`    |
| F6-2 | **The designers load records inconsistently**: MC uses `queryClient.fetchQuery(cbsQueries.modelConfig.record(id))`, while IC uses raw `cbs.send` and then `parseInquiryConfig` itself (`use-inquiry-config.ts:79`), duplicating `cbsQueries` (`schemas.ts:141`) and skipping its cache.                                                                                                                                                                                                                                                                                          |                                                 |
| F6-3 | **The inquiry execution flow is duplicated**: `ops-inquiry.tsx:42-99` and `inquiry-preview.tsx:61-115` both do serialize criteria → `executeQuery` → status check → parse → set step → `console.warn`.                                                                                                                                                                                                                                                                                                                                                                           |                                                 |
| F6-4 | **Legacy fallbacks in a "zero-legacy" codebase**: `card-container.tsx:63-71` ("falls back to legacy variant") and `canvas-inspectors.tsx:87` ("maps legacy variant to new atomic fields").                                                                                                                                                                                                                                                                                                                                                                                       | `grep -rn 'legacy' src/components src/features` |
| F6-5 | **Type escapes in the designers**: `(f as unknown as { id?: string }).id` (`use-fc-section-ops.ts:67,76`, `use-fc-field-movement.ts:18`) shows that the designer-only `id` is missing from the `FormElement` contract. `inquiry-model-popover.tsx:45` casts `properties` the same way.                                                                                                                                                                                                                                                                                           |                                                 |
| F6-6 | Over budget: `fc-canvas-fields.ts` 383, `fc-widget-fields.ts` 368, `fc-field-fields.ts` 362, `canvas-card-container-block.tsx` 340, `mc-general-fields.ts` 291. Inside `form-config`, 5 self-imports use absolute deep paths (`@/features/system/form-config/fields/…`).                                                                                                                                                                                                                                                                                                         |                                                 |

### Before → after

```ts
// AFTER — components/cbs-screen/hooks/use-cbs-designer-record.ts (L4, beside useCbsPersistence)
export function useCbsDesignerRecord<T extends object, E extends CbsScreenValidationError<string>>(cfg: {
  persistence: ReturnType<typeof useCbsPersistence<T>>;
  query: (id: string) => FetchQueryOptions<T | null>;      // always cbsQueries.*
  createDraft: (id: string) => T;
  validate: (record: T) => E[];
  save: (record: T, id: string) => CbsWirePayload;         // generic payload factory (F3-5)
  invalidate: QueryKey[];
  labels: { entity: string };
}) { /* fetchRecord · initDraft · validate · submit · reset · loading/submitting/errors */ }

// Each designer keeps only its domain ops:
const lifecycle = useCbsDesignerRecord({ persistence, query: cbsQueries.inquiryConfig.record, … });
const columns = useIcColumnOps(lifecycle.setFormData);
```

```ts
// AFTER — components/cbs-inquiry-engine/hooks/use-inquiry-execution.ts, shared by OpsInquiry + InquiryPreview
export function useInquiryExecution(schema: InquiryConfigRecord, controller: string) {
  return { execute(criteria: CbsFilterCriteriaMap, signal?: AbortSignal): Promise<InquiryRow[]>, rows, loading };
}
```

> [!IMPORTANT]
> **F6-4 depends on data, not only code.** Before deleting the legacy `variant` fallback, scan `mock/db/SC_FORM_CONFIG.ts` **and the live `CONFIG.FORM` records** for the legacy keys. If live records still carry them, migrate the data first, either with a one-off script or through the Form Config designer's save path, which already writes the atomic fields. Then delete the fallback.

### Exit gate P6

- [ ] All 4 designers run on `useCbsDesignerRecord` and load through `cbsQueries`. Target: `features/system/*/hooks` shrinks by ≥ 500 lines with no behaviour change.
- [ ] `parseInquiryConfig` is called only inside `lib/cbs-client/queries`, and there is a single `useInquiryExecution`.
- [ ] 0 `legacy` fallbacks and 0 `as unknown as` remain in `src/features` and `src/components`.
- [ ] Every file is within budget (≤ 300/350 lines for components, ≤ 250/280 for hooks and helpers).
- [ ] Manual smoke test of each designer in static mode: load existing → edit → validate error → save → reload. Also a dynamic form (`ACCOUNT I …`), with Maker ≠ Checker authorisation, and an inquiry with filters and paging in both panel and popup mode.
- [ ] `pnpm verify:form-spec` · `verify:inquiry` · `verify:screen` · `verify:mock` · `verify:all` all green.

---

## Phase 7 — Root App, Routing & Route Handlers (L6)

**Scope:** [src/app/](../../../src/app/) (1,269 lines), [src/proxy.ts](../../../src/proxy.ts).

### Red flags

| ID   | Finding                                                                                                                                                                                                                                     | Evidence                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| F7-1 | **A route file holds domain logic.** [screen/[id]/page.tsx](<../../../src/app/(workbench)/screen/[id]/page.tsx>) is 290 lines covering bus listeners, the heartbeat (F4-4), tab hydration, the dock protocol and the lock UI.               |                                                 |
| F7-2 | **Popup URL params are not validated.** `searchParams.get("mode") as CbsScreenMode` and `searchParams.get("step") as "SELECTION" \| "RESULTS"` are casts at a trust boundary, with no `safeParse`.                                          | lines 117-121                                   |
| F7-3 | The proxy route adds `success: true` to responses (this goes away with F1-1). After Phase 3 the route should contain only these steps: session check, `safeParse`, access check, envelope build, `getOrSetResult`, invalidate, and respond. | [route.ts](../../../src/app/api/proxy/route.ts) |

> [!NOTE]
> Compliant, so no action: `runtime`/`dynamic` segment config is repeated in each route file, which Next.js requires because segment config has to be statically analysable per file. Data access in the routes already goes through `getSession` and `await`ed request APIs.

### Before → after

```tsx
// AFTER — app/(workbench)/screen/[id]/page.tsx (thin route)
export default function StandaloneScreenPage() {
  return (
    <CbsAppStoreProvider>
      <StandaloneScreen />
    </CbsAppStoreProvider>
  ); // from @/features/workbench
}
// features/workbench/standalone/use-popup-params.ts
const params = popupSearchParamsSchema.safeParse(Object.fromEntries(searchParams)); // L0 schema
```

### Exit gate P7 (final)

- [ ] Every file in `src/app` is ≤ 120 lines and contains composition only.
- [ ] Every `searchParams` and `params` read goes through a Zod schema.
- [ ] `pnpm build` succeeds, and `pnpm typecheck` · `pnpm lint` · `pnpm verify:all` · `pnpm verify:api` are all green.
- [ ] The Appendix A inventory is re-run: dead exports = 0, and test-only exports are either removed or marked `/** @internal */`.

---

## Execution Rules (all phases)

1. **One finding = one commit.** Each commit names its ID (`refactor(F2-1): …`) and passes all gates on its own, so `git bisect` stays usable.
2. **Write the guard first.** Where a phase adds a new verify case (F3-3, F3-4, F4-2), commit the case first and watch it fail, then commit the fix.
3. **Don't reopen a lower layer.** If a Phase 6 change seems to need a Phase 2 API change, stop and add a Phase 2 follow-up item instead of patching the lower layer in place.
4. **Delete instead of wrapping.** No re-export shims, no `@deprecated` aliases, no `?? legacy` arms (AGENTS.md §1.1 "Zero Legacy").
5. **Watch the live boundary.** Run `verify:api` against the live core (`DATA_SOURCE=grpc`) at the P1 (status enum), P3 and P7 exit gates. Static mode can't prove wire compatibility.

| Phase | Primary risk                               | Suites                                                    | Live check   |
| ----- | ------------------------------------------ | --------------------------------------------------------- | ------------ |
| P0    | Line-ending commit hides blame             | lint                                                      | —            |
| P1    | Core emits a status outside the enum       | schemas, layers, all                                      | `verify:api` |
| P2    | Client depends on its own re-parse         | parsers, utils, logger, inquiry, all                      | —            |
| P3    | Cache or dispatch behaviour change         | client, grpc, redis, config, mock, all                    | `verify:api` |
| P4    | Read-only and RIDASHL answers diverge      | access, command, record, screen, all                      | —            |
| P5    | Visual regressions at 1366×768             | layers, all + manual visual pass                          | —            |
| P6    | Designer behaviour drift; legacy form data | form-spec, inquiry, screen, mock, all + manual smoke test | data scan    |
| P7    | Popup hydration and docking                | all, build                                                | `verify:api` |

---

## Appendix A — Dead-Export Inventory

This is a static scan of every `export` in `src/` and `mock/`. A name counts as used if it is referenced outside its own file on any line other than a barrel re-export. **Confirm each item by hand before you delete it**, because dynamic or string-keyed access can't be detected this way.

**Never referenced (src):** `mapMenuItemToTreeNode`, `SettingsTabItem`, `DatePicker`, `CreateNewFieldOptions`, `DesignerFieldCardProps`, `CanvasBlockFlowProps`, `InsertionIndicatorProps`, `FIELD_ANCHOR_SECTION`, `ACTION_INSPECTOR_SECTIONS`, `clearWorkbenchDraft`\*, `setWorkbenchDraft`\*, `ClientConfig`, `ServerConfig`, `getServices`, `parseMenuTreeList`, `UpdateBranchSessionInput`, `ApiStatus`, `CbsRecordStatusCode`, `ControlAction`, `FormRoutine`, `RoutineItem`, `BooleanWidgetConfig`, `DateWidgetConfig`, `FieldConditionOperator`, `FormOnChangeRule`, `NumberWidgetConfig`, `ParameterOptionItem`, `RateWidgetConfig`, `inquiryExecuteOptionsSchema`, `inquiryRowSchema`\*, `MENU_ACTIONS`, `MENU_TYPES`, `menuTreeNodeSchema`, `IdDef`, `getActiveSessionStore`, `getActiveWorkbenchStore`, `CBS_RECORD_STATUS_DEFINITIONS`\*.

\* **Revive, don't delete.** These are canonical sources that the duplicate code should have been using (F1-5, F2-1, F4-2).

**Never referenced (mock):** the 15 `*_LIST` table exports, `CBS_MAIN_NAV_TREE`, `queryCbsDatabase`, `getMockInquiryPayload`.

**Used only by `scripts/verify`:** `getMockProxyResponse`, `CommandTabPayload`, `buildFallbackSections`, `deleteFieldValue`, `validateSingleField`, `getPrimaryInquiryCommand`, `parseFixedSelectionToWire`, `createBaseline`, `getService`, `isSensitiveKey`, `maskAccountNumber`, `sanitizeUserSession`, `parseModelConfig`, `apiResponseSchema`, `formElementSchema`, `propertyWidthSchema`, `isFinancialRequest`, `singleFlight`, `resetCircuit`. For each one, either test it through the public API that uses it or mark it `/** @internal */`. Do not keep production code alive just for tests.
