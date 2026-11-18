# CBS Inquiry Spec (`@/lib/cbs-inquiry-spec`)

The headless rules for **inquiry screens** (`INQ <NAME>`): how an inquiry configuration becomes table columns, how the operator's filters become the core's `queryString`, and how a row action becomes a workbench command. It has no React and no I/O, so it runs on the client, on the server and in `scripts/verify`.

Rendering lives one layer up in [`@/components/cbs-inquiry-engine`](../../components/cbs-inquiry-engine/README.md), and the config shapes (`InquiryConfigRecord`, `INQDef`, `INQSelectField`, `INQCmd`) live in `@/lib/data-schemas`.

---

## Where it sits in an inquiry

```text
SC_INQUIRY_CONFIG (core / mock)            ← one record per inquiry: INQInfo, INQDef[], INQSelectField[], INQCmd[]
        │
        ├─ INQSelectField[] ─► buildDefaultCriteria()   → empty FilterCriteriaMap for the filter bar
        │                      serializeCriteriaToWire() → InquiryCriteriaParam[] (the core's queryString)
        │
        ├─ INQDef[] ─────────► deriveInquiryColumnMeta()  → width, alignment, grid position per column
        │
        └─ INQCmd[] ─────────► resolveCommandTemplate()   → "ACCOUNT S @ID" + row → "ACCOUNT S 1001"
                               executeInquiryCommand()    → cbsCommand.execute(…)
```

---

## Modules

| File                  | Responsibility                                                                                                                                                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `column-compiler.ts`  | Parses and formats the core's column strings: length + alignment (`"20,L"`) and grid position (`"1,2"`). `deriveInquiryColumnMeta()` turns one `INQDef` into display metadata, using only the config (no guessing from field names).                           |
| `criteria-mapper.ts`  | `buildDefaultCriteria()` builds the empty filter state. `serializeCriteriaToWire()` builds the request filters in a fixed order (see below). `parseFixedSelectionToWire()` parses `INQInfo.fixedSelection` strings such as `"STATUS EQ AU, CATEGORY EQ 1001"`. |
| `command-resolver.ts` | Fills a row's values into `INQCmd.cmdFor` templates and hands the result to `cbsCommand.execute`. Supports commands stored on the row itself (`cmdFromInternal` + `cmdFieldName`). `executePrimaryInquiryCommand()` is what a double-click on a row runs.      |
| `constants.ts`        | The operand list (`EQ`, `GT`, `LT`, `GE`, `LE`, `RG`, `CT`, `SW`, `EW`, `NE`, `LK`) and the record-status filter options, which come from `CBS_RECORD_STATUS_DEFINITIONS` (`NEW` is left out because the core never stores it).                                |

---

## Invariants

1. **Filter order is fixed.** `serializeCriteriaToWire()` always emits, in this order: the branch filter (only when the caller passes a branch), the configured `fixedSelection`, then the operator's non-empty criteria. Blank values are dropped, and the operand defaults to `EQ`.
2. **The branch comes from the caller, never from the config.** The engine passes the session branch only when `INQInfo.showBranchWise` is set (see `runInquiry` in the engine).
3. **Row actions go through the command gateway.** Row commands are always run with `cbsCommand.execute`, never by routing directly, so aliases, RBAC and screen resolution apply to them exactly as they do to typed commands.
4. **`@internal` exports** (`getPrimaryInquiryCommand`, `parseFixedSelectionToWire`) are public only so `scripts/verify` can test them. Don't use them in app code.

---

## Verification

```bash
pnpm verify:inquiry
```

The suite lives in `scripts/verify/verify-cbs-inquiry-spec.ts`. Add a case there when you change column parsing, filter serialization or command templates.
