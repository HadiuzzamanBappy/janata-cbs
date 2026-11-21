# CBS Inquiry Spec (`@/lib/cbs-inquiry-spec`)

The headless rules for **inquiry screens** (`INQ <NAME>`): how an inquiry configuration becomes table columns, how the operator's filters reach the core, how the server composes the core's `queryString`, how a row offers its actions, and how rows sort. It has no React, no I/O and no side effects (it imports only `@/lib/data-schemas` and `@/types`), so it runs on the client, in `/api/proxy` and in `scripts/verify`.

Rendering lives one layer up in [`@/components/cbs-inquiry-engine`](../../components/cbs-inquiry-engine/README.md). The config shapes (`InquiryConfigRecord`, `INQDef`, `INQSelectField`, `INQCmd`), the wire contract (`inquiryRunDataSchema`, `inquiryResultSchema`) and the fixed-selection grammar and save rules (`parseFixedSelection`, `inquiryConfigSaveSchema`) live in `@/lib/data-schemas`.

---

## Where it sits in an inquiry

```text
browser                                         /api/proxy (resolveInquiryEnvelope)                 core
INQSelectField[] ─► buildDefaultCriteria()
operator input ──► serializeCriteriaToWire() ─► INQ { recordId: <inquiry ID>, queryString } ─►
                                                 loads the saved inquiry (GET INQUIRY, spec cache)
                                                 composeInquiryQuery() ─► branch · fixed · filters ─► controller table
INQDef[] ────────► deriveInquiryColumnMeta()    rows ◄─ { rows ≤ INQUIRY_MAX_ROWS, total } ◄──────────
rows ────────────► sortInquiryRows()
INQCmd[] + row ──► resolveRowActions() / primaryRowCommand() ─► cbsCommand.execute(…) (in the engine)
```

---

## Modules

| File                  | Responsibility                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `criteria-mapper.ts`  | `buildDefaultCriteria()` seeds the filter screen from each filter's configured value and operand. `serializeCriteriaToWire()` is what the browser sends: configured filters with a value, in config order, with a locked operand kept. `composeInquiryQuery()` is the server side: it builds the core's `queryString` and refuses anything that could widen the result. |
| `column-compiler.ts`  | Parses and formats the core's column strings: length + alignment (`"20,L"`) and grid position (`"1,2"`). `deriveInquiryColumnMeta()` turns one `INQDef` into display metadata from the config only: the format from whole routine tokens (`DATE.CONVERT` → date, `AMT` → currency, no routine + `R` → number), amounts always right-aligned and monospaced.             |
| `command-resolver.ts` | `resolveCommandTemplate()` fills a row's values into an `INQCmd.cmdFor` template. `resolveRowActions()` and `primaryRowCommand()` decide what each button and a double-click run. `rowCommandOf()` reads a dynamic row command.                                                                                                                                         |
| `row-sorter.ts`       | `sortInquiryRows()` (numeric for amounts and numbers, a cached numeric-aware collator otherwise, empty cells last, stable) and `nextInquirySort()` (asc → desc → off).                                                                                                                                                                                                  |
| `constants.ts`        | `INQUIRY_OPERAND_OPTIONS` (every core operand with its label) and `operandOptionsFor(type)`; `inquiryPageSize(info)` and `INQUIRY_UNPAGED_MAX_ROWS`.                                                                                                                                                                                                                    |

---

## Invariants

1. **The server builds the query.** The browser sends the inquiry ID and the operator's filter values only (`inquiryRunDataSchema`, strict). `/api/proxy` loads the saved inquiry and takes its controller, service, fixed selection, branch scope and row cap from it, so a tampered request can't pick another table, drop a fixed condition or read another branch.
2. **Filter order is fixed and nothing widens silently.** `composeInquiryQuery()` emits the branch filter (branch-wise inquiries: `INQUIRY_BRANCH_FIELD` `EQ` the session branch), then the fixed selection, then the operator's filters. It refuses (never drops) an invalid fixed selection, a filter the inquiry doesn't define or sends twice, a filter on a field the fixed selection or the branch sets, a changed locked operand, a pattern operand (`CT`, `SW`, `EW`, `LK`) on a non-text filter, and a missing required filter.
3. **Fixed selections fail closed.** `parseFixedSelection()` reports every statement that isn't `field OPERAND value`, including an unterminated quote (which would otherwise swallow the statements after it) and a stray quote inside a value. Quote a value that holds a quote: `name EQ "O'Brien"`.
4. **Commands fail closed.** Only the tokens after `SCREEN FUNCTION` are row fields. A template that isn't `SCREEN [RIDASHL] [field…]`, or a field with no single-token value on the row (missing, blank, a list, a value with spaces, a prototype key), resolves to "" and the action is disabled. A row without a key (`recordId` "") never runs an `@ID` command: the parser doesn't invent keys.
5. **Buttons run their own command.** Each `INQCmd` runs its `cmdFor`; only a button without one runs the dynamic row command (`cmdFromInternal` + `cmdFieldName`, a complete command run as sent). With no buttons, the row command is a single Open action. A double-click runs the row command, else the first See (`S`) button, else the first button. The function code (the command's second token) decides the right an action needs.
6. **Saves are checked twice.** The designer and `/api/proxy` both run `inquiryConfigSaveSchema` on an inquiry commit; it also rejects unknown top-level keys, a branch filter or fixed branch in a branch-wise inquiry, a filter on a fixed field and a locked operand that isn't the filter's operator.

---

## Verification

```bash
pnpm verify:inquiry
```

The suite lives in `scripts/verify/verify-cbs-inquiry-spec.ts`. The proxy's resolution (`resolveInquiryEnvelope`) is covered in `verify:grpc`, the wire and save schemas in `verify:schemas`, and the mock's filtering in `verify:mock`. Add a case when you change any of these rules.
