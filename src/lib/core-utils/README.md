# 🛠️ CBS Core Utilities (`@/lib/core-utils`)

The centralized banking formatting, mathematical evaluation, and document export library for the **Janata Core Banking Workbench**.

It provides pure, zero-dependency utility functions specifically tailored to South Asian and international core banking standards: **Bangladeshi Taka (BDT) Lakh/Crore currency formatting**, **accounting negative conventions**, **13-digit account number masking**, **CBS value date translation**, **sandboxed mathematical formula evaluation**, and **Excel-safe UTF-8 BOM document exports**.

---

## 📦 What It Contains

```text
src/lib/core-utils/
├── currency.ts     # BDT currency formatting, accounting negatives (100.00 BDT), Lakh/Crore grouping (en-IN)
├── account.ts      # 13-digit account number masking (0123•••••9012) and hyphen chunking (0123-456789-012)
├── date.ts         # CBS value date parser (YYYYMMDD -> DD-MMM-YYYY) and transaction timestamps
├── formula.ts      # Sandboxed mathematical formula evaluator and dependency token extractor (DAG)
├── export.ts       # UTF-8 BOM CSV exporter, styled standalone HTML report generator, and escaped XML exporter
├── string.ts       # Title Case formatter preserving banking acronyms (CBS, HO, PLC, ATM, BDT, USD)
├── cn.ts           # Tailwind CSS classnames merge utility (clsx + tailwind-merge)
└── index.ts        # Public barrel export
```

---

## 🚀 How to Use

### 1. Currency & Number Formatting (`currency.ts`)

Converts numbers into localized BDT with South Asian comma grouping (Lakhs and Crores):

```typescript
import { formatCurrency, formatNumber } from "@/lib/core-utils";

// Standard BDT formatting:
formatCurrency(150000); 
// "1,50,000.00 BDT"

// Accounting negative format:
formatCurrency(-5000, { accountingNegative: true }); 
// "(5,000.00 BDT)"

// Raw number without currency symbol:
formatNumber(1234567.89); 
// "12,34,567.89"
```

---

### 2. Account Number Masking & Formatting (`account.ts`)

Protects customer privacy across screens while retaining audit visibility:

```typescript
import { maskAccountNumber, formatAccountNumber } from "@/lib/core-utils";

// UI Masking: preserves first 4 and last 4 digits
maskAccountNumber("0123456789012");
// "0123•••••9012"

// Standard 13-digit hyphen chunking:
formatAccountNumber("0123456789012");
// "0123-456789-012"
```

---

### 3. Date & CBS Value Date Parsers (`date.ts`)

Translates raw banking dates into human-readable British English (`en-GB`) date formats:

```typescript
import { formatValueDate, formatDateTime } from "@/lib/core-utils";

// CBS 8-digit Value Date:
formatValueDate("20261012"); 
// "12 Oct 2026"

// Transaction timestamp:
formatDateTime(new Date()); 
// "17-Oct-2026 02:11:00"
```

---

### 4. Sandboxed Dynamic Formula Evaluator (`formula.ts`)

Used by the dynamic form engine to calculate derived fields (e.g. Total = Principal + Interest):

```typescript
import { evaluateFormula, extractFormulaDependencies } from "@/lib/core-utils";

const context = {
  principalAmount: 100000,
  interestRate: 9.5,
};

// Safe computation (whitelisted math tokens only):
const total = evaluateFormula(
  "principalAmount + (principalAmount * interestRate / 100)",
  context
);
// 109500

// Extract field dependencies for reactive change detection:
const deps = extractFormulaDependencies(
  "principalAmount + (principalAmount * interestRate / 100)"
);
// ["principalAmount", "interestRate"]
```

---

### 5. Document & Table Exports (`export.ts`)

Generates downloadable CSV, HTML, and XML files directly in the browser:

```typescript
import { exportToCsv, exportToHtmlReport, exportToXml } from "@/lib/core-utils";

const columns = [
  { key: "accountNo", header: "Account Number" },
  { key: "balance", header: "Current Balance" },
];

const rows = [
  { accountNo: "0101-0001", balance: 50000 },
  { accountNo: "0101-0002", balance: 120000 },
];

// Excel-ready CSV (with \uFEFF Byte Order Mark for Unicode/Bengali characters):
exportToCsv("accounts_report", columns, rows);

// Standalone styled HTML printable report:
exportToHtmlReport("accounts_report", columns, rows, {
  title: "Branch Accounts Audit",
});
```

---

## 🛡️ Security & Reliability Highlights

1. **Formula Injection Protection:**
   `evaluateFormula()` runs a strict whitelist check (`/^[\d\s+\-*/().%]+$/`) before execution. It is impossible to execute arbitrary JavaScript, access DOM objects, or trigger network calls.
2. **Excel Mojibake Prevention:**
   `exportToCsv()` prepends a UTF-8 BOM (`\uFEFF`). When opened in Microsoft Excel on Windows, Bengali characters and accented names display without encoding corruption.
3. **Acronym Preservation in Title Case:**
   `toTitleCase("BRANCH HO MANAGER")` returns `"Branch HO Manager"`, preserving known banking acronyms (`CBS`, `HO`, `PLC`, `ATM`, `BDT`, `USD`, `POS`).

---

## 🔒 Architectural State: Scalable or Sealed?

### 1. Formatting & Formula Primitives: **SEALED**
Currency formatters, value date parsers, account chunkers, and math evaluators are complete and finalized.

### 2. Acronyms & Currency Settings: **SCALABLE**
- If new banking acronyms should be preserved in title case, add them to `acronyms` in `string.ts`.
- Default currency and locale can be tuned in `src/lib/core-config/client.ts` (`format.currency`, `format.locale`).

---

## 🧪 Verification

Run the core utilities test suite:
```bash
pnpm verify:utils
```
