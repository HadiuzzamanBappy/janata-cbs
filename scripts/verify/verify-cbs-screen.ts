/**
 * Automated Verification Suite for CBS Screen Architecture (@/lib/cbs-screen)
 *
 * Tests:
 * 1. Persistence resolution precedence & Zod validation parsing (@/lib/cbs-screen/persistence)
 * 2. Action bar capabilities, permission filtering & deduplication (@/lib/cbs-screen/actions)
 * 3. Validation mapping & SSR-safe DOM focus resolution (@/lib/cbs-screen/validation)
 * 4. Workbench bus contracts, popup ID formatting & messaging (@/lib/cbs-screen/workbench-bus)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-cbs-screen.ts
 */

import { z } from "zod";
import {
  CBS_SCREEN_EVENT,
  CBS_SCREEN_MESSAGE,
  focusFormField,
  getDefaultMoreActions,
  makePopupTabId,
  mapZodIssuesToTabs,
  resolveInitialFormData,
  resolveInitialRecordId,
  resolveInitialScreenMode,
  resolveMoreActions,
} from "@/lib/cbs-screen";
import { CbsRecordFunction } from "@/types";

interface TestReport {
  name: string;
  passed: boolean;
  error?: string;
}

const reports: TestReport[] = [];

function assert(name: string, condition: boolean, extraInfo?: string) {
  if (condition) {
    reports.push({ name, passed: true });
    console.log(`[PASS] ${name}`);
  } else {
    reports.push({ name, passed: false, error: extraInfo });
    console.error(`[FAIL] ${name}${extraInfo ? ` -> ${extraInfo}` : ""}`);
  }
}

console.log("\n========================================================");
console.log("       CBS SCREEN ARCHITECTURE & CAPABILITY SUITE       ");
console.log("========================================================\n");

// ============================================================================
// 1. Persistence Resolution Precedence
// ============================================================================
console.log("--- 1. Persistence Resolution Precedence ---");

// 1.1 Record ID Precedence
assert(
  "resolveInitialRecordId: Explicit initialId takes precedence and uppercase trims",
  resolveInitialRecordId("  prop_id  ", "tab_id") === "PROP_ID",
);

assert(
  "resolveInitialRecordId: Tab store recordId takes precedence when no initialId",
  resolveInitialRecordId(undefined, "  tab_id  ") === "TAB_ID",
);

assert(
  "resolveInitialRecordId: Falls back to empty string when no ID source exists",
  resolveInitialRecordId(undefined, undefined) === "",
);

// 1.2 Screen Mode Precedence & Validation
assert(
  "resolveInitialScreenMode: Valid tab mode takes precedence ('S' -> SEE)",
  resolveInitialScreenMode("S", "REC001") === CbsRecordFunction.SEE,
);

assert(
  "resolveInitialScreenMode: Defaults to INPUT when ID exists but no mode specified",
  resolveInitialScreenMode(undefined, "REC001", "IDLE") === CbsRecordFunction.INPUT,
);

assert(
  "resolveInitialScreenMode: Defaults to fallbackMode when no ID and no mode specified",
  resolveInitialScreenMode(undefined, undefined, "IDLE") === "IDLE",
);

assert(
  "resolveInitialScreenMode: Invalid tab mode is ignored and falls back",
  resolveInitialScreenMode("INVALID_MODE", undefined, "IDLE") === "IDLE",
);

// 1.3 Form Data Resolution & Zod Validation
const userSchema = z.object({
  name: z.string(),
  age: z.number().min(18),
});

const defaultUser = { name: "Default User", age: 25 };
const validUser = { name: "John Doe", age: 30 };
const invalidUser = { name: "Minor", age: 12 };

assert(
  "resolveInitialFormData: Uses fallback initialData when tab cache is empty",
  resolveInitialFormData(null, userSchema, defaultUser).name === "Default User",
);

assert(
  "resolveInitialFormData: Hydrates valid data from tab cache matching schema",
  resolveInitialFormData(validUser, userSchema, defaultUser).name === "John Doe",
);

assert(
  "resolveInitialFormData: Rejects invalid schema data and reverts to initialData baseline",
  resolveInitialFormData(invalidUser, userSchema, defaultUser).age === 25,
);

// ============================================================================
// 2. Action Bar Capability & Permission Filtering
// ============================================================================
console.log("\n--- 2. Action Bar Capability & Permission Filtering ---");

const defaultActions = getDefaultMoreActions("ACCOUNT");

assert(
  "getDefaultMoreActions: Returns standard preset actions (Copy, Paste, SFL, SFU)",
  defaultActions.length >= 4 &&
    defaultActions.some((a) => a.label === "Copy") &&
    defaultActions.some((a) => a.label === "Paste"),
);

const customActions = [
  {
    label: "Export Statement",
    command: "EXP",
    onClick: () => {},
    requiredRight: CbsRecordFunction.SEE,
  },
  {
    label: "Custom Copy Action",
    command: "COPY", // Override default COPY preset
    onClick: () => {},
  },
];

const resolved = resolveMoreActions("ACCOUNT", customActions);

assert(
  "resolveMoreActions: Preserves custom actions and merges base presets",
  resolved.some((a) => a.label === "Export Statement") && resolved.some((a) => a.label === "Paste"),
);

assert(
  "resolveMoreActions: Custom action overrides base action with matching command/label",
  resolved.filter((a) => a.command === "COPY").length === 1 &&
    resolved.find((a) => a.command === "COPY")?.label === "Custom Copy Action",
);

// ============================================================================
// 3. Validation Mapping & SSR-Safe DOM Focus
// ============================================================================
console.log("\n--- 3. Validation Mapping & SSR-Safe DOM Focus ---");

const testZodSchema = z.object({
  general: z.object({
    accountTitle: z.string().min(5, "Title must have at least 5 chars"),
  }),
  limits: z.object({
    dailyMax: z.number().positive("Must be positive"),
  }),
});

const parseResult = testZodSchema.safeParse({
  general: { accountTitle: "A" },
  limits: { dailyMax: -100 },
});

if (!parseResult.success) {
  const mappedErrors = mapZodIssuesToTabs(parseResult.error.issues, (path) => {
    return path[0] === "limits" ? "limits-tab" : "general-tab";
  });

  assert(
    "mapZodIssuesToTabs: Generates correct number of mapped errors",
    mappedErrors.length === 2,
  );

  assert(
    "mapZodIssuesToTabs: Categorizes tab IDs correctly via resolver",
    mappedErrors.some((e) => e.tab === "general-tab") &&
      mappedErrors.some((e) => e.tab === "limits-tab"),
  );

  assert(
    "mapZodIssuesToTabs: Computes dot-delimited fieldKey accurately",
    mappedErrors.some((e) => e.fieldKey === "general.accountTitle") &&
      mappedErrors.some((e) => e.fieldKey === "limits.dailyMax"),
  );
} else {
  assert("mapZodIssuesToTabs: Parse failure expected for test fixture", false);
}

assert(
  "focusFormField: Gracefully returns false in non-DOM/SSR environments",
  focusFormField("general.accountTitle") === false,
);

// ============================================================================
// 4. Workbench Bus Contracts & Popup Formatting
// ============================================================================
console.log("\n--- 4. Workbench Bus Contracts & Popup Formatting ---");

assert(
  "makePopupTabId: Converts spaces to clean snake_case identifiers",
  makePopupTabId("LOAN APPLICATION SCREEN") === "popup-LOAN_APPLICATION_SCREEN",
);

assert(
  "makePopupTabId: Handles single identifier strings without modification",
  makePopupTabId("ACCOUNT") === "popup-ACCOUNT",
);

assert(
  "CBS_SCREEN_EVENT: DOCK_TO_SHELL contract is immutable",
  CBS_SCREEN_EVENT.DOCK_TO_SHELL === "cbs:dock-to-shell",
);

assert(
  "CBS_SCREEN_MESSAGE: DOCK_TAB contract matches expected string",
  CBS_SCREEN_MESSAGE.DOCK_TAB === "CBS_DOCK_TAB",
);

assert(
  "CBS_SCREEN_MESSAGE: RECORD_MUTATED contract matches expected string",
  CBS_SCREEN_MESSAGE.RECORD_MUTATED === "CBS_RECORD_MUTATED",
);

// ============================================================================
// Consolidated Summary
// ============================================================================
console.log("\n========================================================");
const allPassed = reports.every((r) => r.passed);
if (allPassed) {
  console.log(`ALL ${reports.length} CBS SCREEN TESTS PASSED WITH 100% SUCCESS!`);
} else {
  console.error("SOME CBS SCREEN TESTS FAILED!");
  process.exit(1);
}
console.log("========================================================\n");
