/**
 * Automated Verification Suite for CBS Command Gateway (@/lib/cbs-command)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * capability exposed by `@/lib/cbs-command` with explicit Input and Output visualization:
 * 1. Grammar & Syntax: Rejection of invalid inputs and casing normalization
 * 2. Standard Form Command: Function code, Record ID, and Version parsing
 * 3. Comma Auto-Auth Mode: Trailing comma parsing with auth level 0
 * 4. Inquiry Command: INQ prefix, query string extraction, and criteria state
 * 5. System Quick Actions: Settings navigation and terminal shortcuts
 * 6. Aliases & Registry: Shorthand resolution and canonical screen mapping
 * 7. Catalog & Menu Indexing: Master commands and recursive menu extraction
 * 8. RBAC Security Validation: RIDASH enforcement, session check, and function rights
 * 9. Execution Pipeline: Adapter routing, payload drafting, and window popup staging
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-cbs-command.ts
 */

import {
  type CommandTabPayload,
  cbsCommand,
  extractMenuCommands,
  getAllRegisteredCommands,
  getCanonicalScreenKey,
  registerCommandAdapter,
  resolveCommandAlias,
  resolveCommandTitle,
  type UserSecurityProfile,
  validateSecurityPermissions,
} from "@/lib/cbs-command";
import { clientConfig } from "@/lib/core-config";
import type { MenuItem } from "@/lib/data-schemas";
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
  console.log("================================================================================");
  console.log("     CBS COMMAND GATEWAY VERIFICATION SUITE (@/lib/cbs-command)");
  console.log("================================================================================");

  // ----------------------------------------------------------------------------
  // 1. Grammar & Syntax: Input Sanitization & Error Handling
  // ----------------------------------------------------------------------------
  const emptyInput = "   ";
  const emptyAst = cbsCommand.parse(emptyInput);
  const badIdInput = "123INVALID";
  const badIdAst = cbsCommand.parse(badIdInput);

  recordTest(
    "1. Grammar Syntax Rejection: Empty string & invalid starting characters",
    { empty: emptyInput, badId: badIdInput },
    { emptyValid: emptyAst.isValid, badIdValid: badIdAst.isValid },
    !emptyAst.isValid && !badIdAst.isValid,
  );

  // ----------------------------------------------------------------------------
  // 2. Standard Form Command: Casing, Version, Function & Record ID
  // ----------------------------------------------------------------------------
  const formCmdInput = "account,vip i 10001";
  const formAst = cbsCommand.parse(formCmdInput);

  recordTest(
    "2. Form Command Parsing: Version, action function, and target record ID",
    formCmdInput,
    {
      app: formAst.application,
      version: formAst.version,
      func: formAst.functionCode,
      mode: formAst.screenMode,
      id: formAst.recordId,
      valid: formAst.isValid,
    },
    formAst.application === "ACCOUNT" &&
      formAst.version === "VIP" &&
      formAst.functionCode === CbsRecordFunction.INPUT &&
      formAst.screenMode === "I" &&
      formAst.recordId === "10001" &&
      formAst.isValid,
  );

  // ----------------------------------------------------------------------------
  // 3. Comma Auto-Auth Mode: Trailing comma zero-auth direct entry
  // ----------------------------------------------------------------------------
  const commaInput = "USER, 20002";
  const commaAst = cbsCommand.parse(commaInput);

  recordTest(
    "3. Comma Version Direct Entry: Zero-auth (Level 0) immediate form navigation",
    commaInput,
    {
      app: commaAst.application,
      authLevel: commaAst.authLevel,
      isCommaVersion: commaAst.isCommaVersion,
      recordId: commaAst.recordId,
    },
    commaAst.application === "USER" &&
      commaAst.authLevel === 0 &&
      commaAst.isCommaVersion === true &&
      commaAst.recordId === "20002",
  );

  // ----------------------------------------------------------------------------
  // 4. Inquiry Command: INQ prefix, query string extraction, and default 'S' mode
  // ----------------------------------------------------------------------------
  const inqInput = "INQ GET.CUSTOMER.PORTFOLIO";
  const inqAst = cbsCommand.parse(inqInput);

  recordTest(
    "4. Inquiry Command Parsing: Prefix recognition and target inquiry query",
    inqInput,
    {
      type: inqAst.type,
      app: inqAst.application,
      mode: inqAst.screenMode,
    },
    inqAst.type === "INQUIRY" &&
      inqAst.application === "GET.CUSTOMER.PORTFOLIO" &&
      inqAst.screenMode === "S",
  );

  // ----------------------------------------------------------------------------
  // 5. Settings Modal Navigation & Tab Selection
  // ----------------------------------------------------------------------------
  const settingsInput = "SETTINGS:PROFILE";
  const settingsAst = cbsCommand.parse(settingsInput);
  const themeSettings = cbsCommand.parse("SETTINGS:APPEARANCE");

  recordTest(
    "5. Settings Navigation: Direct tab selection & configuration routing",
    { settings: settingsInput, appearance: "SETTINGS:APPEARANCE" },
    {
      settingsTab: settingsAst.settingsTabId,
      appearanceTab: themeSettings.settingsTabId,
    },
    settingsAst.type === "SETTINGS" &&
      settingsAst.settingsTabId === "profile" &&
      themeSettings.type === "SETTINGS" &&
      themeSettings.settingsTabId === "appearance",
  );

  // ----------------------------------------------------------------------------
  // 6. Aliases & Canonical Screen Mapping
  // ----------------------------------------------------------------------------
  const aliasInput = "MD";
  const resolvedTarget = resolveCommandAlias(aliasInput);
  const canonicalScreen = getCanonicalScreenKey(aliasInput);
  const screenTitle = resolveCommandTitle(aliasInput);

  recordTest(
    "6. Command Alias Resolution: Shorthand alias to canonical screen key & title",
    aliasInput,
    { resolvedTarget, canonicalScreen, screenTitle },
    resolvedTarget === "SC.MENU.DESIGN" &&
      canonicalScreen === "SC.MENU.DESIGN" &&
      screenTitle === "Menu Hierarchy",
  );

  // ----------------------------------------------------------------------------
  // 7. Catalog & Recursive Menu Hierarchy Indexing
  // ----------------------------------------------------------------------------
  const sampleMenu: MenuItem[] = [
    {
      id: "grp_cust",
      menuId: 100,
      label: "Customer Services",
      children: [
        { id: "itm_cu", menuId: 101, label: "Customer Profile", command: "CUSTOMER I" },
        { id: "itm_inq", menuId: 102, label: "Search Customers", command: "INQ GET.CUST" },
      ],
    },
  ];
  const masterCommands = getAllRegisteredCommands();
  const extractedCommands = extractMenuCommands(sampleMenu);

  recordTest(
    "7. Catalog & Menu Indexing: Master definitions and recursive tree extraction",
    { menuCount: sampleMenu.length },
    {
      masterRegisteredCount: masterCommands.length,
      extractedCount: extractedCommands.length,
      commands: extractedCommands.map((c) => c.command),
    },
    masterCommands.length >= 7 &&
      extractedCommands.length === 2 &&
      extractedCommands.some((c) => c.command === "CUSTOMER I") &&
      extractedCommands.some((c) => c.command === "INQ GET.CUST"),
  );

  // ----------------------------------------------------------------------------
  // 8. RBAC Security Clearance: RIDASH enforcement & role restrictions
  // ----------------------------------------------------------------------------
  const deleteCmd = cbsCommand.parse("ACCOUNT D 99001");
  const readOnlyUser: UserSecurityProfile = {
    userId: "AUDITOR_01",
    commandLine: true,
    accessibility: "RS",
  };
  const adminUser: UserSecurityProfile = {
    userId: "OFFICER_01",
    commandLine: true,
    accessibility: "RIDASH",
  };

  const auditorCheck = validateSecurityPermissions(deleteCmd, readOnlyUser);
  const officerCheck = validateSecurityPermissions(deleteCmd, adminUser);

  recordTest(
    "8. RBAC Security Clearance: Enforcing RIDASH rights on Delete function",
    { command: "ACCOUNT D 99001", users: [readOnlyUser.userId, adminUser.userId] },
    {
      auditorAllowed: auditorCheck.allowed,
      auditorReason: auditorCheck.reason,
      officerAllowed: officerCheck.allowed,
    },
    !auditorCheck.allowed && auditorCheck.requiredRight === "D" && officerCheck.allowed === true,
  );

  // ----------------------------------------------------------------------------
  // 9. Command Execution Router & Storage Staging
  // ----------------------------------------------------------------------------
  const dispatchedTabs: CommandTabPayload[] = [];
  const teardownAdapter = registerCommandAdapter({
    getCurrentUser: () => adminUser,
    openTab: (tab) => dispatchedTabs.push(tab),
  });

  const mockStorage = new Map<string, string>();
  const originalWindow = (globalThis as unknown as Record<string, unknown>).window;
  const originalSessionStorage = (globalThis as unknown as Record<string, unknown>).sessionStorage;
  let openedUrl = "";

  (globalThis as unknown as Record<string, unknown>).window = {
    open: (url: string) => {
      openedUrl = url;
      return { focus: () => {} };
    },
    sessionStorage: {
      setItem: (key: string, val: string) => mockStorage.set(key, val),
      getItem: (key: string) => mockStorage.get(key) ?? null,
    },
    dispatchEvent: () => true,
  };
  (globalThis as unknown as Record<string, unknown>).sessionStorage = {
    setItem: (key: string, val: string) => mockStorage.set(key, val),
    getItem: (key: string) => mockStorage.get(key) ?? null,
  };

  try {
    // 9a: Workspace tab dispatch
    cbsCommand.execute("ACCOUNT I 50001", {
      silent: true,
      formData: { title: "Corporate Account" },
    });

    // 9b: Detached popup window & session staging
    cbsCommand.execute("ACCOUNT S 50001", {
      silent: true,
      target: "popup",
      tabId: "popup_tab_50001",
      formData: { stagedFlag: true },
    });

    const stagedDraftKey = clientConfig.storage.session.draft("popup_tab_50001");
    const hasStagedData = mockStorage.get(stagedDraftKey)?.includes("stagedFlag") ?? false;

    recordTest(
      "9. Command Execution Router: Tab routing & detached window session staging",
      { executeForm: "ACCOUNT I 50001", executePopup: "ACCOUNT S 50001" },
      {
        dispatchedTabsCount: dispatchedTabs.length,
        dispatchedScreenId: dispatchedTabs[0]?.screenId,
        popupOpenedUrl: openedUrl,
        popupStagedStorage: hasStagedData,
      },
      dispatchedTabs.length === 1 &&
        dispatchedTabs[0]?.screenId === "ACCOUNT" &&
        dispatchedTabs[0]?.screenMode === "I" &&
        openedUrl.includes("/screen/ACCOUNT") &&
        hasStagedData,
    );
  } finally {
    teardownAdapter();
    (globalThis as unknown as Record<string, unknown>).window = originalWindow;
    (globalThis as unknown as Record<string, unknown>).sessionStorage = originalSessionStorage;
  }

  // ----------------------------------------------------------------------------
  // Final Master Summary
  // ----------------------------------------------------------------------------
  console.log("\n================================================================================");
  const total = testCases.length;
  const passed = testCases.filter((t) => t.passed).length;
  const failed = total - passed;

  if (failed === 0) {
    console.log(
      `\x1b[32m✔ SUCCESS: ALL ${total} COMMAND GATEWAY CAPABILITY TESTS PASSED WITH 100% SUCCESS!\x1b[0m`,
    );
    console.log(
      "================================================================================\n",
    );
  } else {
    console.error(`\x1b[31m✖ FAILURE: ${failed} OF ${total} TESTS FAILED!\x1b[0m`);
    console.log(
      "================================================================================\n",
    );
    process.exit(1);
  }
}

runSuite().catch((err: unknown) => {
  console.error("Fatal Test Suite Crash:", err);
  process.exit(1);
});
