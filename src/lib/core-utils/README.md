# 🛠️ CBS Core Utilities (`@/lib/core-utils`)

A pure, side-effect-free standard library of common banking formatters, UI helpers, and document export utilities for the **Janata Core Banking Workbench**.

---

## 📦 What It Contains

```
src/lib/core-utils/
├── cn.ts           # Tailwind CSS classnames merge utility (clsx + tailwind-merge)
├── currency.ts     # Currency formatting with BDT defaults and accounting parenthetical negatives
├── date.ts         # Julian / value date parser and ISO timestamp formatters
├── export.ts       # CSV (with Excel UTF-8 BOM), HTML report, and XML table exporters
├── id.ts           # generateIdempotencyKey (UUIDv4 for mutations) and generateClientToken (short UI-only IDs)
├── index.ts        # Central public export barrel
├── storage.ts      # cbsStorage: the only Web Storage gateway (SSR-safe, JSON + Zod validated)
└── string.ts       # toTitleCase (keeps banking acronyms) and formatNameToLabel ("nomineeNid" → "Nominee NID")
```

---

## 🚀 How to Use

### 1. Currency Formatting (`formatCurrency`)

```typescript
import { formatCurrency } from "@/lib/core-utils";

formatCurrency(150000); // "1,50,000.00 BDT"
formatCurrency(-5000, { accountingNegative: true }); // "(5,000.00 BDT)"
formatCurrency(2500, { currency: "USD", decimals: 2 }); // "2,500.00 USD"
```

### 2. Date Formatting (`formatValueDate`, `formatDateTime`)

```typescript
import { formatValueDate, formatDateTime } from "@/lib/core-utils";

formatValueDate("20261012"); // "12 Oct 2026"
formatDateTime(new Date()); // "02 Nov 2026 23:30:00"
```

### 3. Title Case with Acronyms (`toTitleCase`, `formatNameToLabel`)

```typescript
import { formatNameToLabel, toTitleCase } from "@/lib/core-utils";

toTitleCase("BRANCH HO MANAGER"); // "Branch HO Manager" (HO preserved)
toTitleCase("CUSTOMER PLC ATM"); // "Customer PLC ATM"
formatNameToLabel("nomineeNid"); // "Nominee NID"
```

### IDs (`generateIdempotencyKey`, `generateClientToken`)

`generateIdempotencyKey()` returns a UUIDv4 for mutation requests; it falls back to a non-crypto generator outside secure contexts (plain HTTP on an IP address). `generateClientToken(prefix)` returns a short ID such as `id_1a2b3c4d` for UI-only items that are never sent to the core as record IDs.

### 4. Document & Table Exports (`exportToCsv`, `exportToHtmlReport`, `exportToXml`)

```typescript
import { exportToCsv, exportToHtmlReport, exportToXml } from "@/lib/core-utils";

const columns = [
  { key: "accountNo", header: "Account Number" },
  { key: "balance", header: "Balance" },
];
const rows = [{ accountNo: "AC10001", balance: 50000 }];

exportToCsv("accounts", columns, rows);
exportToHtmlReport("accounts", columns, rows);
exportToXml("accounts", columns, rows);
```

### 5. Web Storage (`cbsStorage`)

The only module allowed to call `localStorage` / `sessionStorage`. Every call is SSR-safe and
absorbs quota, privacy-mode and disabled-storage errors, so callers never write `try/catch`.
Methods: `get`, `set`, `remove`, `removeByPrefix`, `readJson`, `writeJson`.

```typescript
import { cbsStorage } from "@/lib/core-utils";
import { clientConfig } from "@/lib/core-config";
import { filterCriteriaMapSchema } from "@/lib/data-schemas";

cbsStorage.set("local", clientConfig.storage.local.lastActivity, String(Date.now()));
cbsStorage.remove("local", clientConfig.storage.local.lastActivity);

// JSON with optional Zod validation — corrupt or wrong-shaped data reads back as null
const criteria = cbsStorage.readJson("session", key, filterCriteriaMapSchema);
```

---

## 🧪 Verification

```bash
pnpm verify:utils
```
