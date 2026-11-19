# CBS Inquiry Engine (`@/components/cbs-inquiry-engine`)

The React side of inquiry screens: the filter bar, the result table, pagination and row actions, plus `runInquiry()`, the one function that sends an inquiry to the core. It renders whatever an `InquiryConfigRecord` describes, so no inquiry has screen-specific code.

The rules it applies (columns, filter serialization, command templates) live in [`@/lib/cbs-inquiry-spec`](../../lib/cbs-inquiry-spec/README.md). This barrel re-exports that library, so feature code imports both from `@/components/cbs-inquiry-engine`.

---

## Consumers

| Consumer                                                           | Use                                                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `src/features/operations/inquiries/ops-inquiry.tsx`                | The operator's inquiry screen (`INQ <NAME>`): criteria selection step, then the result grid. |
| `src/features/system/inquiry-config/components/ic-preview-tab.tsx` | Live preview inside the Inquiry Designer.                                                    |

---

## Contents

| Part           | Exports                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Execution      | `runInquiry(config, criteria, { branchCode, perPage, signal })`                                                                     |
| Filters        | `InquiryFilterBar`, `FilterCriterionRow`                                                                                            |
| Table          | `InquiryTable`, `InquiryEmptyState`, `InquiryTableHeader`, `ColumnHeader`, `InquiryTableBody`, `CellFormatter`, `InquiryPagination` |
| Rows & preview | `InquiryRowActions`, `InquiryPreview`                                                                                               |
| Hooks          | `useInquiryPagination`, `useInquirySort` (client-side paging and sorting of the returned rows)                                      |

---

## `runInquiry()` contract

1. Sends to `INQInfo.controllerName`, **never** to the command text the operator typed. If the controller is missing, it throws and tells the operator to set it in the Inquiry Designer.
2. Builds the filters with `serializeCriteriaToWire()`. It passes the session branch only when `INQInfo.showBranchWise` is set.
3. Sends through `cbs.send(cbs.inquiry.executeQuery(…))` with `silent: true` and `responseSchema: inquiryRowListSchema`. Rows arrive already parsed by `/api/proxy` (parsed once on the server), and the client only validates them.
4. If the core rejects the request, it throws the core's message. **Callers own the loading state and the toast**, so a failure is shown exactly once.

---

## Rules

- Inquiry filter inputs run purely from configuration (`INQSelectField`), taking their initial value and placeholder directly from `selectFieldValue`.
- Row clicks and row action menus run commands through `executeInquiryCommand` / `executePrimaryInquiryCommand`, never through `router.push`.
