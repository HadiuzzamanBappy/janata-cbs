---

name: cbs-compact-ui-and-layout
description: >-
Use this skill when designing, authoring, or refactoring user interfaces, screens, forms, tables, and dialogs in Janata CBS. Enforces minimal, compact, high-density banking layout conventions, semantic OKLCH design tokens, 12-column grids, and multi-monitor resolution consistency (from 1366x768 branch terminals to 1920x1080+ workstations).
---

# CBS Compact UI & Responsive Layout Design Runbook

## Overview

Janata CBS serves professional bank tellers, branch managers, and back-office operators. The user interface must be:
- **Minimalist & Clean:** Fast, distraction-free, zero flashy animations, flat borders, subtle surface elevations.
- **High-Density & Compact:** Financial operators process high volumes of data; padding, row heights, and font sizes must optimize screen real estate without clutter.
- **Consistent Across Monitors:** Whether displayed on legacy branch screens (**1366×768** / **1280×720**) or modern high-res workstation displays (**1920×1080 (FHD)** / **1440p** / multi-window popouts), layout structure, alignment, and readability must remain rock-solid without unintended wrapping or horizontal overflow.

---

## 1. High-Density Sizing & Spacing Matrix

Never use standard consumer web dimensions (e.g., `h-11`, `p-6`, `text-base`). Adhere strictly to the compact CBS density matrix:

| Element Type                    | CBS Standard Classes                                            | Notes                                                 |
| :------------------------------ | :-------------------------------------------------------------- | :---------------------------------------------------- |
| **Form Inputs & Selects**       | `h-8 px-2.5 text-xs rounded-md`                                 | Compact banking height; avoids vertical ballooning.   |
| **Field Labels**                | `text-[11px] font-medium text-muted-foreground`                 | Placed directly above or tightly aligned with fields. |
| **Buttons (Primary/Secondary)** | `h-8 px-3 text-xs font-medium rounded-md`                       | Standard touch/click target for banking workflows.    |
| **Icon CTA / Action Buttons**   | `size-7 sm:size-8 rounded-md shrink-0`                          | Icon size inside: `size-3.5` or `size-4`.             |
| **Table Rows & Cells**          | `h-8 px-2.5 py-1 text-xs`                                       | High row density for multi-record accounting lists.   |
| **Status Badges**               | `h-5 px-1.5 text-[10px] font-semibold tracking-wider font-mono` | E.g., `AU`, `INA`, `REV`, `DEL`, `HLD`.               |
| **Form Card Sections**          | `p-3 sm:p-4 gap-3`                                              | Tight card padding with bounded vertical flow.        |

---

## 2. Multi-Resolution & Responsive Viewport Rules

Branch workstations operate across a wide spectrum of monitor hardware and pop-up window configurations:

```
[ Monitor Resolutions ]
  ├─ 1366 x 768   (Standard Branch Terminal Fold - MUST fit primary form cards without vertical clipping)
  ├─ 1920 x 1080  (Modern Workstation - balanced multi-column grid, no extreme horizontal stretching)
  └─ Window Mode  (Multi-window / split panels down to 600px - clean reflow without horizontal scroll)
```

### Invariant 1: Sticky Action Bar & Bounded Scroll Area

Screen layouts must never allow the entire browser page to scroll away from the action header or status bar.
- Use `h-full flex flex-col overflow-hidden` on the screen container.
- Keep the `CbsFormHeader` or `CbsInquiryHeader` sticky/fixed at the top.
- Wrap form bodies or data tables in an explicit `flex-1 overflow-y-auto` viewport.
- This ensures operators at **768px vertical height** can always access action buttons (`Submit`, `Authorize`, `Reverse`, `Search`) without scrolling to the bottom.

### Invariant 2: Predictable 12-Column Responsive Form Grids

Every form must use the standard 12-column grid system (`grid grid-cols-12 gap-3`):
- **Full-width fields (Descriptions, textareas, notes):**
  `col-span-12`
- **Two-column field pairs (Debit/Credit, Account/Title):**
  `col-span-12 sm:col-span-6`
- **Three-column clusters (Branch / Currency / Amount):**
  `col-span-12 sm:col-span-6 lg:col-span-4`
- **Four-column compact clusters (Date / Value Date / Tenor / Rate):**
  `col-span-12 sm:col-span-6 md:col-span-3`

### Invariant 3: Prevent Ultra-Wide Distortion on FHD/4K

On 1920px+ monitors, simple forms must not stretch single inputs across the entire screen.
- Wrap form cards in responsive max-width containers (e.g. `max-w-6xl mx-auto` or structured tabs) to preserve natural visual balance and operator scanning speed.

---

## 3. Financial & Numeric Alignment Rules

Accounting and core banking data require strict visual precision:

1. **Monetary Amounts & Balances:**
   - Always use `font-mono text-right tabular-nums`.
   - Never left-align financial numbers in tables or form fields.
   - Example: `<span className="font-mono text-xs text-right tabular-nums font-semibold">{formatCurrency(val)}</span>`

2. **Account IDs, Transaction References & IBANs:**
   - Always render in monospace: `font-mono tracking-wider`.
   - Ensures visual distinction between similar characters (e.g., `0` vs `O`, `1` vs `I`).

3. **Dates & Timestamps:**
   - Render in monospace or tabular format: `font-mono text-xs text-muted-foreground`.

---

## 4. Semantic Color Tokens (OKLCH Only)

Never hardcode arbitrary hex codes (`#1e40af`) or Tailwind numbered colors (`bg-blue-600`, `text-zinc-900`, `border-gray-200`). Style strictly with semantic CSS variables defined in `globals.css`:

```tsx
// ✅ Correct (Semantic Tokens)
<div className="bg-card text-card-foreground border border-border rounded-md shadow-xs">
  <label className="text-[11px] font-medium text-muted-foreground">Account Title</label>
  <input className="h-8 bg-background border-input text-foreground focus:ring-ring" />
</div>

// ❌ Forbidden (Hardcoded Colors & Huge Padding)
<div className="bg-white text-gray-900 border border-gray-300 p-8 rounded-2xl shadow-xl">
  <label className="text-base text-gray-600">Account Title</label>
  <input className="h-12 bg-white border-blue-500 text-black" />
</div>
```

---

## 5. Universal Screen Scaffold Pattern

All banking screens must render through the canonical `CbsScreenScaffold` from `@/components/cbs-screen`:

```tsx
import { CbsScreenScaffold } from "@/components/cbs-screen";
import { CbsRecordFunction } from "@/types";

export function TransactionScreen({ command, tabId }: ScreenProps) {
  return (
    <CbsScreenScaffold
      title="Customer Account Maintenance"
      commandCode="ACCOUNT"
      recordId={recordId}
      mode={currentMode}
      isDirty={isDirty}
      submitting={submitting}
      tabs={[
        {
          id: "general",
          label: "General Info",
          content: <GeneralInfoTab />,
        },
        {
          id: "limits",
          label: "Overdraft Limits",
          content: <LimitsTab />,
        },
      ]}
      onSubmit={handleSubmit}
      onAuthorizeReverse={handleAuthorize}
      onDelete={handleDelete}
    />
  );
}
```

---

## 6. Pre-Commit UI Quality Checklist

Before completing any UI change:
- [ ] **Density Check:** Are inputs/buttons `h-8` with `text-xs` typography?
- [ ] **Viewport Check (1366x768):** Does the primary screen card and action header fit without vertical cutoffs or awkward dual scrollbars?
- [ ] **Monospace Financials:** Are currencies, amounts, account IDs, and dates set to `font-mono tabular-nums`?
- [ ] **Semantic Tokens:** Are all colors using semantic classes (`bg-primary`, `bg-card`, `border-border`, `text-muted-foreground`) with zero hardcoded numbers?
- [ ] **Responsive Reflow:** Does the form reflow cleanly when tested in split view / window mode without horizontal scroll?
