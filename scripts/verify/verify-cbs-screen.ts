/**
 * Automated Verification Suite for CBS Screen Architecture (@/lib/cbs-screen)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * capability exposed by `@/lib/cbs-screen` with explicit Input and Output visualization:
 * 1. Initial Record ID Resolution (resolveInitialRecordId: prop, tab, fallback)
 * 2. Screen Mode Precedence & Resolution (resolveInitialScreenMode: query, tab, default)
 * 3. Zod-Validated Form Data Resolution (resolveInitialFormData: schema check, fallback)
 * 4. More Actions Resolution & Preset Inheritance (resolveMoreActions & getDefaultMoreActions)
 * 5. Zod Issue to Tab Validation Mapping (mapZodIssuesToTabs: tab routing & message extraction)
 * 6. Workbench Popup Tab ID Generation (makePopupTabId: formatting & normalization)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-cbs-screen.ts
 */

import { z } from "zod";
import {
  clearAllWorkbenchDrafts,
  clearWorkbenchDraft,
  getDefaultMoreActions,
  getTabInstanceId,
  getWorkbenchDraft,
  makePopupTabId,
  mapZodIssuesToTabs,
  resolveInitialFormData,
  resolveInitialRecordId,
  resolveInitialScreenMode,
  resolveMoreActions,
  setWorkbenchDraft,
} from "@/lib/cbs-screen";
import { clientConfig } from "@/lib/core-config";
import { CbsRecordFunction } from "@/types";

interface TestCase {
  title: string;
  input: unknown;
  output: unknown;
  passed: boolean;
  error?: string;
}

const testCases: TestCase[] = [];

function recordTest(
  title: string,
  input: unknown,
  output: unknown,
  condition: boolean,
  error?: string,
) {
  testCases.push({ title, input, output, passed: condition, error });
  const statusTag = condition ? "\x1b[32m✔ [PASS]\x1b[0m" : "\x1b[31m✖ [FAIL]\x1b[0m";
  console.log(`\n${statusTag} ${title}`);
  console.log(`       Input  : ${typeof input === "string" ? input : JSON.stringify(input)}`);
  console.log(`       Output : ${typeof output === "string" ? output : JSON.stringify(output)}`);
  if (!condition && error) {
    console.error(`       Error  : ${error}`);
  }
}

async function runSuite() {
  console.log("\n================================================================================");
  console.log("             CBS SCREEN ARCHITECTURE & CAPABILITY VERIFICATION                   ");
  console.log("================================================================================");
  console.log(" Architecture : Universal Screen Scaffold & Persistence (@/lib/cbs-screen)");
  console.log(" Pattern      : Single Unique Test per Screen Capability with Visible IO");
  console.log("================================================================================");

  // ── 1. Initial Record ID Resolution ──
  console.log("\n── 1. Initial Record ID Resolution (resolveInitialRecordId) ──");
  const resolvedId = resolveInitialRecordId("  acc_1001  ", "acc_default");
  recordTest(
    "1.1 Resolves explicit initialId with uppercase trimming over tab search id",
    { initialId: "  acc_1001  ", tabSearchId: "acc_default" },
    { resolvedId },
    resolvedId === "ACC_1001",
  );

  const fallbackId = resolveInitialRecordId(undefined, undefined);
  recordTest(
    "1.2 Falls back to empty string when no record ID sources are present",
    { initialId: undefined, tabSearchId: undefined },
    { resolvedId: fallbackId },
    fallbackId === "",
  );

  // ── 2. Screen Mode Precedence & Resolution ──
  console.log("\n── 2. Screen Mode Precedence & Resolution (resolveInitialScreenMode) ──");
  const modeWithId = resolveInitialScreenMode(undefined, "REC001", "IDLE");
  recordTest(
    "2.1 Automatically defaults to 'I' (INPUT) when record ID exists without mode",
    { tabMode: undefined, resolvedId: "REC001", fallbackMode: "IDLE" },
    { resolvedMode: modeWithId },
    modeWithId === CbsRecordFunction.INPUT,
  );

  const modeWithTab = resolveInitialScreenMode("S", "REC001", "IDLE");
  recordTest(
    "2.2 Honors canonical tab mode ('S' -> SEE) over record ID presence",
    { tabMode: "S", resolvedId: "REC001" },
    { resolvedMode: modeWithTab },
    modeWithTab === CbsRecordFunction.SEE,
  );

  // ── 3. Zod-Validated Form Data Resolution ──
  console.log("\n── 3. Zod-Validated Form Data Resolution (resolveInitialFormData) ──");
  const userSchema = z.object({
    accountNo: z.string().min(1),
    balance: z.number().min(0),
  });
  const validData = { accountNo: "AC10001", balance: 5000 };
  const initialFallback = { accountNo: "", balance: 0 };

  const parsedValid = resolveInitialFormData(validData, userSchema, initialFallback);
  recordTest(
    "3.1 Validates and returns cached tab form data when matching Zod schema",
    { cachedData: validData },
    { resolvedData: parsedValid },
    parsedValid.accountNo === "AC10001" && parsedValid.balance === 5000,
  );

  // An unsaved work-in-progress draft is often invalid by commit rules (e.g. a new model with an
  // empty DESCRIPTION). It must survive a remount, pop-out or reload; Commit validates it later.
  const wipDraft = { accountNo: "AC10001", balance: -50 }; // Fails min(0)
  const parsedWip = resolveInitialFormData(wipDraft, userSchema, initialFallback);
  const parsedMissing = resolveInitialFormData(undefined, userSchema, initialFallback);
  recordTest(
    "3.2 Keeps an incomplete (commit-invalid) draft as-is; uses the template only when there is no draft",
    { wipDraft, noDraft: undefined },
    { resolvedWip: parsedWip, resolvedMissing: parsedMissing },
    parsedWip.accountNo === "AC10001" &&
      parsedWip.balance === -50 &&
      parsedMissing.accountNo === "" &&
      parsedMissing.balance === 0,
  );

  // ── 4. More Actions Resolution & Preset Inheritance ──
  console.log("\n── 4. More Actions Resolution & Preset Inheritance ──");
  const defaultActions = getDefaultMoreActions("ACCOUNT");
  const extraAction = {
    label: "Generate Statement",
    command: "GEN_STMT",
    onClick: () => {},
  };
  const mergedActions = resolveMoreActions("ACCOUNT", [extraAction]);
  recordTest(
    "4.1 Merges custom actions while preserving canonical CBS presets (Copy, Paste, SFL, SFU)",
    { extraAction: extraAction.command, basePresetsCount: defaultActions.length },
    {
      mergedTotalCount: mergedActions.length,
      firstActionCommand: mergedActions[0]?.command,
      hasSFL: mergedActions.some((a) => a.command === "SFL"),
    },
    mergedActions[0]?.command === "GEN_STMT" &&
      mergedActions.length === defaultActions.length + 1 &&
      mergedActions.some((a) => a.command === "SFL"),
  );

  // ── 5. Zod Issue to Tab Validation Mapping ──
  console.log("\n── 5. Zod Issue to Tab Validation Mapping (mapZodIssuesToTabs) ──");
  const schemaWithTabs = z.object({
    generalName: z.string().min(3, "Name must be at least 3 chars"),
    auditStamp: z.string().min(1, "Audit stamp required"),
  });
  const parseResult = schemaWithTabs.safeParse({ generalName: "A", auditStamp: "" });
  const rawIssues = !parseResult.success ? parseResult.error.issues : [];

  const mappedErrors = mapZodIssuesToTabs(rawIssues, (path) => {
    return path[0]?.toString().startsWith("general") ? "generalTab" : "auditTab";
  });
  recordTest(
    "5.1 Maps raw Zod validation issues to target CBS screen tabs with field keys",
    { issueCount: rawIssues.length },
    {
      mappedCount: mappedErrors.length,
      firstError: { tab: mappedErrors[0]?.tab, fieldKey: mappedErrors[0]?.fieldKey },
    },
    mappedErrors.length === 2 &&
      mappedErrors[0]?.tab === "generalTab" &&
      mappedErrors[1]?.tab === "auditTab",
  );

  // ── 6. Workbench Popup Tab ID Generation ──
  console.log("\n── 6. Workbench Popup Tab ID Generation (makePopupTabId) ──");
  const popupId = makePopupTabId("CUSTOMER ACCOUNT OPENING");
  recordTest(
    "6.1 Normalizes screen ID into deterministic popup tab identifier",
    { inputScreen: "CUSTOMER ACCOUNT OPENING" },
    { popupId },
    popupId === "popup-CUSTOMER_ACCOUNT_OPENING",
  );

  // ── 7. Single Tab Instance ID Resolution ──
  console.log("\n── 7. Single Tab Instance ID Resolution (getTabInstanceId) ──");
  const ssrTabId = getTabInstanceId();
  recordTest(
    "7.1 Returns empty string in SSR environment (typeof window === 'undefined')",
    { env: "node" },
    { tabId: ssrTabId },
    ssrTabId === "",
  );

  // ── 8. Popup Draft Hand-off Lifecycle ──
  console.log("\n── 8. Popup Draft Hand-off (setWorkbenchDraft / getWorkbenchDraft / clear) ──");
  const handoff = new Map<string, string>();
  const draftKey = clientConfig.storage.session.draft("popup_t8");
  const criteriaKey = clientConfig.storage.session.criteria("popup_t8");
  const globals = globalThis as unknown as Record<string, unknown>;
  globals.window = {
    sessionStorage: {
      getItem: (k: string) => handoff.get(k) ?? null,
      setItem: (k: string, v: string) => handoff.set(k, v),
      removeItem: (k: string) => handoff.delete(k),
    },
  };

  // A complex nested designer draft: form sections → fields, inquiry columns, model properties → PROP
  const designerDraft = {
    formId: "ACCOUNT,1.0.0",
    frmElements: [{ id: "sec1", title: "General", fields: [{ name: "title", colSpan: 6 }] }],
    INQSelectField: [{ fieldName: "branchCode", operand: "EQ", defaultValue: "" }],
    PROPERTIES: [{ NAME: "jointHolders", TYPE: "Array", PROP: [{ NAME: "holderName" }] }],
  };
  let hydratedRead: unknown = null;
  let fallbackRead: unknown = null;
  try {
    setWorkbenchDraft("popup_t8", designerDraft); // opener stages before window.open
    handoff.set(criteriaKey, "{}");
    hydratedRead = getWorkbenchDraft("popup_t8"); // popup first mount
    fallbackRead = getWorkbenchDraft("popup_t8"); // still staged: a fallback if the tab is lost
  } finally {
    delete globals.window;
  }
  const expected = JSON.stringify(designerDraft);
  recordTest(
    "8.1 setWorkbenchDraft stages a nested designer draft intact; reading it does not consume it",
    { draftKey, sections: 1, columns: 1, properties: "PROP[1]" },
    { hydratedRead, fallbackRead },
    JSON.stringify(hydratedRead) === expected && JSON.stringify(fallbackRead) === expected,
  );

  globals.window = {
    sessionStorage: {
      getItem: (k: string) => handoff.get(k) ?? null,
      setItem: (k: string, v: string) => handoff.set(k, v),
      removeItem: (k: string) => handoff.delete(k),
    },
  };
  try {
    clearWorkbenchDraft("popup_t8"); // the main shell received the dock
  } finally {
    delete globals.window;
  }
  recordTest(
    "8.2 clearWorkbenchDraft (on dock) removes both the form draft and the inquiry criteria",
    { keys: [draftKey, criteriaKey] },
    { remaining: [...handoff.keys()] },
    handoff.size === 0,
  );

  // Operator switch: the previous user's leftover popup hand-offs go; unrelated keys stay
  const session = clientConfig.storage.session;
  const leftover = new Map<string, string>([
    [session.draft("popup_a"), "{}"],
    [session.criteria("popup_b"), "{}"],
    [session.workbenchTabs, "{}"],
  ]);
  globals.window = {
    sessionStorage: {
      get length() {
        return leftover.size;
      },
      key: (i: number) => [...leftover.keys()][i] ?? null,
      getItem: (k: string) => leftover.get(k) ?? null,
      setItem: (k: string, v: string) => leftover.set(k, v),
      removeItem: (k: string) => leftover.delete(k),
    },
  };
  try {
    clearAllWorkbenchDrafts();
  } finally {
    delete globals.window;
  }
  recordTest(
    "8.3 clearAllWorkbenchDrafts (operator switch) removes every draft and criteria key, nothing else",
    { keys: [session.draft("popup_a"), session.criteria("popup_b"), session.workbenchTabs] },
    { remaining: [...leftover.keys()] },
    leftover.size === 1 && leftover.has(session.workbenchTabs),
  );

  // Consolidated Summary
  const passedTests = testCases.filter((t) => t.passed).length;
  const failedTests = testCases.filter((t) => !t.passed).length;

  console.log("\n================================================================================");
  if (failedTests === 0) {
    console.log(
      `>>> SUCCESS: ALL ${passedTests} CBS SCREEN ARCHITECTURE CAPABILITIES VALIDATED 100% CLEAN! <<<`,
    );
  } else {
    console.error(`>>> FAILURE: ${failedTests} TESTS FAILED! <<<`);
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runSuite().catch((err: unknown) => {
  console.error("Fatal Test Suite Crash:", err);
  process.exit(1);
});
