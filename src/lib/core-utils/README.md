# 🛠️ CBS Core Utilities (`@/lib/core-utils`)

A pure, side-effect-free standard library of common banking formatters, UI helpers, and document export utilities for the **Janata Core Banking Workbench**.

---

## 📦 What It Contains

```
src/lib/core-utils/
├── cn.ts           # Tailwind CSS classnames merge utility (clsx + tailwind-merge)
├── currency.ts     # Currency formatting with BDT defaults and accounting parenthetical negatives
├── date.ts         # The date/time contract: ISO checks, inbound conversion, bank-time display
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

### 2. Dates and times (`date.ts`, the single source of truth)

Inside the system a date is ISO `YYYY-MM-DD` and a date-time is ISO with an offset (`2026-10-27T11:22:52+06:00`). Bank time is `CBS_TIME_ZONE` (Asia/Dhaka, no daylight saving). Don't parse or format dates anywhere else.

```typescript
import {
  formatDate,
  formatDateTime,
  isIsoDate,
  toIsoDate,
  toIsoDateTime,
  todayIso,
} from "@/lib/core-utils";

// Inbound only, once, at the boundary (proxy audit times, form record load, inquiry rows)
toIsoDate("20250101"); // "2025-01-01"  (legacy core format)
toIsoDateTime("2026-10-27 11:22:52"); // "2026-10-27T11:22:52+06:00"  (legacy core format)

isIsoDate("2026-02-30"); // false: validation is strict ISO
formatDate("2025-01-01"); // "01 Jan 2025"
formatDateTime("2026-10-27T05:22:52Z"); // "27 Oct 2026 11:22:52" (bank time)
todayIso(); // the bank's calendar day, never the UTC date
```

`toIsoDate` / `toIsoDateTime` are the only code that knows the core's legacy formats (`YYYYMMDD`, `YYYY-MM-DD HH:mm:ss`). When the core sends ISO, delete their `LEGACY` branches and case 3.1's legacy inputs in `verify:utils`; nothing else changes.

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
