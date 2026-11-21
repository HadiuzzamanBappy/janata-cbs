# CBS Inquiry Engine (`@/components/cbs-inquiry-engine`)

The React side of inquiry screens: the filter bar, the result table with its pagination and row actions, the designer's live preview, and `useInquiryRunner()`, which runs an inquiry. It renders whatever an `InquiryConfigRecord` describes, so no inquiry has screen-specific code.

The rules it applies (columns, filters, commands, sorting) live in [`@/lib/cbs-inquiry-spec`](../../lib/cbs-inquiry-spec/README.md). This barrel re-exports that library, so feature code imports both from `@/components/cbs-inquiry-engine`.

---

## Consumers

| Consumer                                                           | Use                                                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `src/features/operations/inquiries/ops-inquiry.tsx`                | The operator's inquiry screen (`INQ <NAME>`): criteria selection step, then the result grid. |
| `src/features/system/inquiry-config/components/ic-preview-tab.tsx` | Live preview inside the Inquiry Designer.                                                    |

---

## Contents

| Part      | Exports                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------ |
| Execution | `useInquiryRunner(inquiryId, config)` → `{ run(criteria), running }` (`run-inquiry.ts` holds the single request)         |
| Filters   | `InquiryFilterBar` (controlled: `criteria` + `onCriteriaChange`)                                                         |
| Table     | `InquiryTable` (controlled: `page` + `onPageChange`, `sort` + `onSortChange`); header, body, cells and pagination inside |
| Preview   | `InquiryPreview` (the designer's draft layout over the saved inquiry's data)                                             |

---

## Running an inquiry

1. `run(criteria)` sends `cbs.inquiry.executeQuery(inquiryId, serializeCriteriaToWire(criteria, fields))` with `silent: true` and `responseSchema: inquiryResultSchema`. The proxy resolves everything else from the saved inquiry (see the spec README). Date columns become ISO once, on arrival.
2. **One query at a time.** A new run aborts the one in flight, and an unmount aborts the last, so a late response never replaces a newer one. `running` disables Find and Refresh.
3. **One toast per run**, raised by the runner: the matched count (a warning when the `INQUIRY_MAX_ROWS` cap trimmed the result), or the failure. An abort is silent.
4. The outcome is `ok` (with `{ rows, total }`), `failed` or `aborted`. The operator screen reruns a tab saved on its results once on mount (refresh, popup, dock-back), retrying only an aborted run.

---

## Rules

- **Paging**: by `INQInfo.perpageItem` when `showPagination` is on, and always above `INQUIRY_UNPAGED_MAX_ROWS` rows. Sorting covers the whole result and resets to page 1; exports use the same order.
- **Row actions**: `resolveRowActions()` gives each button its command and function code. A button is disabled, with the reason in its tooltip, when the row can't fill the command or when `evaluateCbsAccess` denies the function (rights, Four-Eyes on `A`, and status rules when the row carries `auditData.recStatus`). Commands run through `cbsCommand.execute`, never `router.push`.
- **Filters** offer only the operands valid for the field type, keep a locked operand, and mark required filters (checked again by the proxy).
- **Preview**: the query is always the saved, live inquiry. When the draft differs (unsaved, or not authorized) the preview says so; save and authorize to preview changes to the target, fixed selection or filters.
