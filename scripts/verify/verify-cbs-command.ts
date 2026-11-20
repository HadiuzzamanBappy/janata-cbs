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
  getMasterCommands,
  registerCommandAdapter,
  resolveCommandAlias,
  resolveCommandTitle,
  validateSecurityPermissions,
} from "@/lib/cbs-command";
import { clientConfig } from "@/lib/core-config";
import type { MenuItem } from "@/lib/data-schemas";
import { CbsRecordFunction, type CbsUserSecurityContext } from "@/types";

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
  const leadingCommaAst = cbsCommand.parse(",ACCOUNT");
  const doubleCommaAst = cbsCommand.parse("ACCOUNT,,");
  const invalidFuncAst = cbsCommand.parse("ACCOUNT X 10001");

  recordTest(
    "1. Grammar Syntax Rejection: Empty string, invalid prefixes, malformed commas & unknown functions",
    {
      empty: emptyInput,
      badId: badIdInput,
      leadingComma: ",ACCOUNT",
      doubleComma: "ACCOUNT,,",
      invalidFunc: "ACCOUNT X 10001",
    },
    {
      emptyValid: emptyAst.isValid,
      badIdValid: badIdAst.isValid,
      leadingCommaValid: leadingCommaAst.isValid,
      doubleCommaValid: doubleCommaAst.isValid,
      invalidFuncValid: invalidFuncAst.isValid,
      invalidFuncError: invalidFuncAst.error,
    },
    !emptyAst.isValid &&
      !badIdAst.isValid &&
      !leadingCommaAst.isValid &&
      !doubleCommaAst.isValid &&
      !invalidFuncAst.isValid &&
      Boolean(invalidFuncAst.error?.includes("Unrecognized function code")),
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
  // 3. Comma Version Direct Entry: Zero-auth (Level 0) immediate form navigation & Strict Version (USERS,I)
  // ----------------------------------------------------------------------------
  const commaInput = "USER, 20002";
  const commaAst = cbsCommand.parse(commaInput);
  const bareCommaAst = cbsCommand.parse("USERS,");
  const commaWithFunc = cbsCommand.parse("ACCOUNT, I 10001");
  const commaVersionFunc = cbsCommand.parse("ACCOUNT,VIP, I 10001");
  const commaFormConfig = cbsCommand.parse("FC, I 10001");
  const standardLookup = cbsCommand.parse("ACCOUNT 10001");
  const versionNamedI = cbsCommand.parse("USERS,I");
  const versionNamedIWithId = cbsCommand.parse("USERS,I 10001");
  const versionNamedIZeroAuth = cbsCommand.parse("USERS,I,");
  const versionNamedIWithFunc = cbsCommand.parse("USERS,I I 10001");
  const bareFuncAst = cbsCommand.parse("USERS A");

  recordTest(
    "3. Comma Version Direct Entry: Zero-auth (Level 0) immediate form navigation & strict version naming",
    commaInput,
    {
      app: commaAst.application,
      authLevel: commaAst.authLevel,
      version: commaAst.version,
      recordId: commaAst.recordId,
      bareCommaMode: bareCommaAst.screenMode,
      bareCommaAuth: bareCommaAst.authLevel,
      commaWithFuncMode: commaWithFunc.screenMode,
      commaWithFuncAuth: commaWithFunc.authLevel,
      commaVersionFuncApp: commaVersionFunc.application,
      commaVersionFuncVer: commaVersionFunc.version,
      commaVersionFuncAuth: commaVersionFunc.authLevel,
      commaFormConfigApp: commaFormConfig.application,
      commaFormConfigAuth: commaFormConfig.authLevel,
      standardLookupMode: standardLookup.screenMode,
      versionNamedIVer: versionNamedI.version,
      versionNamedIAuth: versionNamedI.authLevel,
      versionNamedIMode: versionNamedI.screenMode,
      versionNamedIWithIdVer: versionNamedIWithId.version,
      versionNamedIWithIdMode: versionNamedIWithId.screenMode,
      versionNamedIZeroAuthVer: versionNamedIZeroAuth.version,
      versionNamedIZeroAuthAuth: versionNamedIZeroAuth.authLevel,
      versionNamedIZeroAuthMode: versionNamedIZeroAuth.screenMode,
      versionNamedIWithFuncVer: versionNamedIWithFunc.version,
      versionNamedIWithFuncCode: versionNamedIWithFunc.functionCode,
      versionNamedIWithFuncMode: versionNamedIWithFunc.screenMode,
    },
    commaAst.application === "USER" &&
      commaAst.authLevel === 0 &&
      commaAst.version === "" &&
      commaAst.recordId === "20002" &&
      commaAst.screenMode === "S" &&
      bareCommaAst.application === "USERS" &&
      bareCommaAst.authLevel === 0 &&
      bareCommaAst.screenMode === "IDLE" &&
      bareCommaAst.functionCode === undefined &&
      commaWithFunc.screenMode === "I" &&
      commaWithFunc.authLevel === 0 &&
      commaVersionFunc.application === "ACCOUNT" &&
      commaVersionFunc.version === "VIP" &&
      commaVersionFunc.authLevel === 0 &&
      commaFormConfig.application === "FORM.CONFIG" &&
      commaFormConfig.authLevel === 0 &&
      standardLookup.screenMode === "S" &&
      versionNamedI.application === "USERS" &&
      versionNamedI.version === "I" &&
      versionNamedI.authLevel === 1 &&
      versionNamedI.screenMode === "IDLE" &&
      versionNamedIWithId.application === "USERS" &&
      versionNamedIWithId.version === "I" &&
      versionNamedIWithId.recordId === "10001" &&
      versionNamedIWithId.screenMode === "S" &&
      versionNamedIZeroAuth.application === "USERS" &&
      versionNamedIZeroAuth.version === "I" &&
      versionNamedIZeroAuth.authLevel === 0 &&
      versionNamedIZeroAuth.screenMode === "IDLE" &&
      versionNamedIWithFunc.application === "USERS" &&
      versionNamedIWithFunc.version === "I" &&
      versionNamedIWithFunc.functionCode === "I" &&
      versionNamedIWithFunc.recordId === "10001" &&
      versionNamedIWithFunc.screenMode === "I" &&
      bareFuncAst.application === "USERS" &&
      bareFuncAst.functionCode === "A" &&
      bareFuncAst.recordId === undefined &&
      bareFuncAst.screenMode === "IDLE",
  );

  // ----------------------------------------------------------------------------
  // 4. Inquiry Command: Any function code, prefix recognition, and missing query rejection
  // ----------------------------------------------------------------------------
  const inqInput = "INQ GET.CUSTOMER.PORTFOLIO";
  const inqAst = cbsCommand.parse(inqInput);
  const inqWithFuncS = cbsCommand.parse("INQ S GET.CUSTOMER.PORTFOLIO");
  const inqWithFuncI = cbsCommand.parse("INQ I GET.CUSTOMER.PORTFOLIO");
  const inqWithFuncL = cbsCommand.parse("INQ L GET.CUSTOMER.PORTFOLIO");
  const inqLongInput = cbsCommand.parse("INQUIRY GET.CUSTOMER.PORTFOLIO");
  const inqMissingQuery = cbsCommand.parse("INQ S");
  const inqBareMissing = cbsCommand.parse("INQ");

  recordTest(
    "4. Inquiry Command Parsing: Prefix recognition, arbitrary function code, and error on missing query",
    inqInput,
    {
      type: inqAst.type,
      app: inqAst.application,
      mode: inqAst.screenMode,
      funcS_mode: inqWithFuncS.screenMode,
      funcI_mode: inqWithFuncI.screenMode,
      funcL_mode: inqWithFuncL.screenMode,
      inqLong_type: inqLongInput.type,
      missingQueryValid: inqMissingQuery.isValid,
      missingQueryError: inqMissingQuery.error,
      bareMissingValid: inqBareMissing.isValid,
    },
    inqAst.type === "INQUIRY" &&
      inqAst.application === "GET.CUSTOMER.PORTFOLIO" &&
      inqAst.screenMode === "S" &&
      inqWithFuncS.screenMode === "S" &&
      inqWithFuncI.screenMode === "I" &&
      inqWithFuncL.screenMode === "L" &&
      inqLongInput.type === "INQUIRY" &&
      !inqMissingQuery.isValid &&
      !inqBareMissing.isValid,
  );

  // ----------------------------------------------------------------------------
  // 5. Settings Modal Navigation & Tab Selection & Shorthand Aliases
  // ----------------------------------------------------------------------------
  const settingsInput = "SETTINGS:PROFILE";
  const settingsAst = cbsCommand.parse(settingsInput);
  const themeSettings = cbsCommand.parse("SETTINGS:APPEARANCE");
  const profileAlias = cbsCommand.parse("PROFILE");
  const themeAlias = cbsCommand.parse("THEME");
  const bareSettings = cbsCommand.parse("SETTINGS");

  recordTest(
    "5. Settings Navigation: Direct tab selection, configuration routing & shorthand aliases",
    { settings: settingsInput, appearance: "SETTINGS:APPEARANCE", alias: "PROFILE" },
    {
      settingsTarget: settingsAst.target,
      appearanceTarget: themeSettings.target,
      profileAliasTarget: profileAlias.target,
      themeAliasTarget: themeAlias.target,
      bareSettingsTarget: bareSettings.target,
    },
    settingsAst.type === "SETTINGS" &&
      settingsAst.target === "profile" &&
      themeSettings.type === "SETTINGS" &&
      themeSettings.target === "appearance" &&
      profileAlias.type === "SETTINGS" &&
      profileAlias.target === "profile" &&
      themeAlias.type === "SETTINGS" &&
      themeAlias.target === "appearance" &&
      bareSettings.type === "SETTINGS" &&
      bareSettings.target === "profile",
  );

  // ----------------------------------------------------------------------------
  // 6. Aliases & Canonical Screen Mapping
  // ----------------------------------------------------------------------------
  const aliasInput = "MD";
  const resolvedTarget = resolveCommandAlias(aliasInput);
  const screenTitle = resolveCommandTitle(aliasInput);

  recordTest(
    "6. Command Alias Resolution: Shorthand alias to canonical screen key & title",
    aliasInput,
    { resolvedTarget, screenTitle },
    resolvedTarget === "MENU.DESIGN" && screenTitle === "Menu Hierarchy",
  );

  // ----------------------------------------------------------------------------
  // 7. Catalog & Recursive Menu Hierarchy Indexing
  // ----------------------------------------------------------------------------
  const sampleMenu: MenuItem[] = [
    {
      id: "grp_cust",
      menuId: 100,
      label: "Customer Services",
      isVisible: true,
      orderIndex: 0,
      children: [
        {
          id: "itm_cu",
          menuId: 101,
          label: "Customer Profile",
          command: "CUSTOMER I",
          isVisible: true,
          orderIndex: 0,
          children: [],
        },
        {
          id: "itm_inq",
          menuId: 102,
          label: "Search Customers",
          command: "INQ GET.CUST",
          isVisible: true,
          orderIndex: 1,
          children: [],
        },
      ],
    },
  ];
  const masterCommands = getMasterCommands();
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
  const readOnlyUser: CbsUserSecurityContext = {
    userId: "AUDITOR_01",
    commandLine: true,
    accessibility: ["R", "S"],
  };
  const adminUser: CbsUserSecurityContext = {
    userId: "OFFICER_01",
    commandLine: true,
    accessibility: ["R", "I", "D", "A", "S", "H"],
  };
  const terminalLockedUser: CbsUserSecurityContext = {
    userId: "TELLER_LOCKED",
    commandLine: false,
    accessibility: ["R", "I", "D", "A", "S", "H"],
  };

  const auditorCheck = validateSecurityPermissions(deleteCmd, readOnlyUser);
  const officerCheck = validateSecurityPermissions(deleteCmd, adminUser);
  const lockedCheck = validateSecurityPermissions(deleteCmd, terminalLockedUser);

  recordTest(
    "8. RBAC Security Clearance: Enforcing RIDASH rights on Delete function and terminal lock",
    {
      command: "ACCOUNT D 99001",
      users: [readOnlyUser.userId, adminUser.userId, terminalLockedUser.userId],
    },
    {
      auditorAllowed: auditorCheck.allowed,
      auditorReason: auditorCheck.reason,
      officerAllowed: officerCheck.allowed,
      lockedAllowed: lockedCheck.allowed,
      lockedReason: lockedCheck.reason,
    },
    !auditorCheck.allowed &&
      auditorCheck.requiredRight === "D" &&
      officerCheck.allowed === true &&
      !lockedCheck.allowed &&
      Boolean(lockedCheck.reason?.includes("Command Line access enabled")),
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
  let stagedAtOpen = false;
  const stagedDraftKey = clientConfig.storage.session.draft("popup_tab_50001");
  const mockSessionStorage = {
    setItem: (key: string, val: string) => mockStorage.set(key, val),
    getItem: (key: string) => mockStorage.get(key) ?? null,
    removeItem: (key: string) => mockStorage.delete(key),
  };

  (globalThis as unknown as Record<string, unknown>).window = {
    open: (url: string) => {
      openedUrl = url;
      // window.open copies the opener's sessionStorage into the popup at this moment
      stagedAtOpen = mockStorage.get(stagedDraftKey)?.includes("stagedFlag") ?? false;
      return { focus: () => {} };
    },
    sessionStorage: mockSessionStorage,
    dispatchEvent: () => true,
  };
  (globalThis as unknown as Record<string, unknown>).sessionStorage = mockSessionStorage;

  try {
    // 9a: Workspace tab dispatch
    cbsCommand.execute("ACCOUNT I 50001", {
      silent: true,
      formData: { title: "Corporate Account" },
    });

    // 9b: Detached popup window. The caller (Pop Out) stages the draft with setWorkbenchDraft;
    // the spawner must leave it in place until the popup docks.
    mockStorage.set(stagedDraftKey, JSON.stringify({ stagedFlag: true }));
    cbsCommand.execute("ACCOUNT S 50001", {
      silent: true,
      target: "popup",
      tabId: "popup_tab_50001",
    });

    const keptAfterOpen = mockStorage.get(stagedDraftKey)?.includes("stagedFlag") ?? false;

    recordTest(
      "9. Command Execution Router: Tab routing; a staged popup draft is visible at window.open and kept until dock",
      { executeForm: "ACCOUNT I 50001", executePopup: "ACCOUNT S 50001" },
      {
        dispatchedTabsCount: dispatchedTabs.length,
        dispatchedScreenId: dispatchedTabs[0]?.screenId,
        popupOpenedUrl: openedUrl,
        stagedAtOpen,
        keptAfterOpen,
      },
      dispatchedTabs.length === 1 &&
        dispatchedTabs[0]?.screenId === "ACCOUNT" &&
        dispatchedTabs[0]?.screenMode === "I" &&
        openedUrl.includes("/screen/ACCOUNT") &&
        stagedAtOpen &&
        keptAfterOpen,
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
