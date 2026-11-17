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
├── id.ts           # Ephemeral UI token generator (generateClientToken)
├── index.ts        # Central public export barrel
├── storage.ts      # cbsStorage: the only Web Storage gateway (SSR-safe, JSON + Zod validated)
└── string.ts       # Title Case string formatter with banking acronym preservation
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
formatDateTime(new Date()); // "02-Nov-2026 23:30:00"
```

### 3. Title Case with Acronyms (`toTitleCase`)

```typescript
import { toTitleCase } from "@/lib/core-utils";

toTitleCase("BRANCH HO MANAGER"); // "Branch HO Manager" (HO preserved)
toTitleCase("CUSTOMER PLC ATM"); // "Customer PLC ATM"
```

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
pnpm verify:all
```
