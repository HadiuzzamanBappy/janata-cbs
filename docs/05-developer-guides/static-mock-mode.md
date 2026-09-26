# 🧪 Offline Mock Mode & Fixtures Guide

## 1. Executive Summary & Purpose
This document provides instructions for running and testing `finx-ui` in offline static mock mode without connecting to a live Java Core gRPC backend.

Mock mode enables frontend developers to build UI screens, test dynamic GMC form engine layouts, run e2e automated tests, and prototype banking workflows even when the Java gRPC backend or network VPN is unavailable.

---

## 2. Enabling Static Mock Mode

### Step 1: Update `.env.local`
Set `MODEL_SOURCE=static` in your local environment file:

```ini
MODEL_SOURCE=static
CACHE_ENABLED=false
```

### Step 2: Static Fixture Directory (`fixtures/`)
When `MODEL_SOURCE=static`, the mock model fetcher in [src/lib/schema/get-model.ts](file:///d:/Work/React/cbs/finx-ui/src/lib/schema/get-model.ts) bypasses gRPC and reads sanitized GMC schemas directly from [fixtures/](file:///d:/Work/React/cbs/finx-ui/fixtures):

```text
fixtures/
├── users.ts                       # Static mock officer accounts & credentials
├── menu.ts                        # Static navigation menu hierarchy
└── specs.ts                       # Static GMC form model definitions (CUSTOMER, ACCOUNT, etc.)
```

---

## 3. Adding a New Static GMC Fixture Spec

To mock a new backend command (e.g. `LOAN.DISBURSE`):
1. Open `fixtures/specs.ts` (or `fixtures/menu.ts`).
2. Add a new `GMC` model schema definition:
   ```typescript
   export const mockLoanDisburseSpec = {
     modelName: "LOAN.DISBURSE",
     title: "Loan Disbursement Entry",
     fields: [
       { name: "accountNo", label: "Account Number", type: "text", required: true, colSpan: 6 },
       { name: "disburseAmount", label: "Disbursement Amount", type: "number", required: true, colSpan: 6 }
     ]
   };
   ```
3. Test loading command `/screen/LOAN.DISBURSE` in browser.

---

## 4. Verification Criteria

To verify mock mode functionality:
```bash
# Typecheck fixtures and static mock handlers
pnpm typecheck

# Lint check fixture code
pnpm lint
```

---

## 5. Affected Documentation Updates
When modifying static mock mode or fixtures, update:
- [docs/05-developer-guides/static-mock-mode.md](file:///d:/Work/React/cbs/finx-ui/docs/05-developer-guides/static-mock-mode.md)
- [README.md](file:///d:/Work/React/cbs/finx-ui/README.md)
