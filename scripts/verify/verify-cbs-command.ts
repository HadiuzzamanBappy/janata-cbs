/**
 * Automated Verification Suite for CBS Command Gateway (@/lib/cbs-command)
 * Tests all grammar rules, RIDASH function access, alias resolution,
 * catalog indexing, and command execution pipelines.
 *
 * Usage:
 *   pnpm tsx scripts/verify-cbs-command.ts
 */

import {
  type CommandTabPayload,
  cbsCommand,
  extractMenuCommands,
  getAllRegisteredCommands,
  getCanonicalScreenKey,
  getCommandAdapter,
  type ParsedCommand,
  registerCommandAdapter,
  resolveCommandAlias,
  resolveCommandTitle,
  type UserSecurityProfile,
  validateSecurityPermissions,
} from "@/lib/cbs-command";
import { clientConfig } from "@/lib/core-config";
import type { MenuItem } from "@/lib/data-schemas";
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

async function runSuite() {
  console.log("\n========================================================");
  console.log("       CBS COMMAND GATEWAY MASTER VERIFICATION SUITE    ");
  console.log("========================================================\n");

  // ============================================================================
  // --- 1. Grammar & Syntax Tokenization (cbsCommand.parse) ---
  // ============================================================================
  console.log("--- 1. Grammar & Syntax Tokenization ---");

  // 1.1 Empty & Whitespace Validation
  const emptyCmd = cbsCommand.parse("");
  assert(
    "Grammar: Rejects empty input",
    !emptyCmd.isValid && (emptyCmd.error?.includes("cannot be empty") ?? false),
  );

  const whitespaceCmd = cbsCommand.parse("    ");
  assert(
    "Grammar: Rejects whitespace-only input",
    !whitespaceCmd.isValid && (whitespaceCmd.error?.includes("cannot be empty") ?? false),
  );

  // 1.2 Invalid Application Identifiers
  const invalidAppCmd = cbsCommand.parse("123INVALID");
  assert(
    "Grammar: Rejects application starting with digit",
    !invalidAppCmd.isValid && (invalidAppCmd.error?.includes("alphanumeric") ?? false),
  );

  const symbolAppCmd = cbsCommand.parse("$$$BAD");
  assert(
    "Grammar: Rejects application with leading symbols",
    !symbolAppCmd.isValid && (symbolAppCmd.error?.includes("alphanumeric") ?? false),
  );

  // 1.3 Case Insensitivity & Whitespace Normalization
  const normalCmd = cbsCommand.parse("   account   ");
  assert(
    "Grammar: Normalizes casing and whitespace",
    normalCmd.application === "ACCOUNT" && normalCmd.screenMode === "IDLE" && normalCmd.isValid,
  );

  // 1.4 Base Application (Search / Idle mode)
  const baseApp = cbsCommand.parse("USER");
  assert(
    "Grammar: Base Application Idle (USER)",
    baseApp.type === "FORM" &&
      baseApp.application === "USER" &&
      baseApp.screenMode === "IDLE" &&
      baseApp.authLevel === 1 &&
      baseApp.isValid,
  );

  // 1.5 Named Version Support
  const namedVer = cbsCommand.parse("USER,1001");
  assert(
    "Grammar: Named Version (USER,1001)",
    namedVer.application === "USER" &&
      namedVer.version === "1001" &&
      namedVer.screenMode === "IDLE" &&
      namedVer.authLevel === 1,
  );

  const multipartVer = cbsCommand.parse("LOAN,RETAIL,V2");
  assert(
    "Grammar: Multipart Named Version (LOAN,RETAIL,V2)",
    multipartVer.application === "LOAN" &&
      multipartVer.version === "RETAIL,V2" &&
      multipartVer.authLevel === 1,
  );

  // 1.6 Direct Record Lookup without Function Code
  const directLookup = cbsCommand.parse("USER 1001");
  assert(
    "Grammar: Direct Record Lookup (USER 1001)",
    directLookup.application === "USER" &&
      directLookup.recordId === "1001" &&
      directLookup.screenMode === "I" &&
      directLookup.functionCode === undefined,
  );

  // 1.7 Explicit Function Modes without Record ID
  const fnInputNoId = cbsCommand.parse("USER I");
  assert(
    "Grammar: Function Input without ID (USER I)",
    fnInputNoId.functionCode === CbsRecordFunction.INPUT &&
      fnInputNoId.screenMode === "I" &&
      fnInputNoId.recordId === undefined,
  );

  const fnSeeNoId = cbsCommand.parse("USER S");
  assert(
    "Grammar: Function See without ID (USER S)",
    fnSeeNoId.functionCode === CbsRecordFunction.SEE &&
      fnSeeNoId.screenMode === "S" &&
      fnSeeNoId.recordId === undefined,
  );

  const fnAuthNoId = cbsCommand.parse("USER A");
  assert(
    "Grammar: Function Authorize without ID (USER A)",
    fnAuthNoId.functionCode === CbsRecordFunction.AUTHORIZE && fnAuthNoId.screenMode === "A",
  );

  const fnDelNoId = cbsCommand.parse("USER D");
  assert(
    "Grammar: Function Delete without ID (USER D)",
    fnDelNoId.functionCode === CbsRecordFunction.DELETE && fnDelNoId.screenMode === "D",
  );

  const fnRevNoId = cbsCommand.parse("USER R");
  assert(
    "Grammar: Function Reverse without ID (USER R)",
    fnRevNoId.functionCode === CbsRecordFunction.REVERSE && fnRevNoId.screenMode === "R",
  );

  const fnHoldNoId = cbsCommand.parse("USER H");
  assert(
    "Grammar: Function History/Hold without ID (USER H)",
    fnHoldNoId.functionCode === CbsRecordFunction.HOLD && fnHoldNoId.screenMode === "H",
  );

  // 1.8 Explicit Function Modes with Record ID
  const fnInputWithId = cbsCommand.parse("USER I 1001");
  assert(
    "Grammar: Function Input with ID (USER I 1001)",
    fnInputWithId.functionCode === "I" &&
      fnInputWithId.recordId === "1001" &&
      fnInputWithId.screenMode === "I",
  );

  const fnSeeWithId = cbsCommand.parse("ACCOUNT S 90001");
  assert(
    "Grammar: Function See with ID (ACCOUNT S 90001)",
    fnSeeWithId.functionCode === "S" &&
      fnSeeWithId.recordId === "90001" &&
      fnSeeWithId.screenMode === "S",
  );

  // 1.9 Composite Record IDs
  const compositeSemicolon = cbsCommand.parse("ACCOUNT S 1000001;2");
  assert(
    "Grammar: Composite ID Semicolon (ACCOUNT S 1000001;2)",
    compositeSemicolon.recordId === "1000001;2" && compositeSemicolon.screenMode === "S",
  );

  const compositeSpaced = cbsCommand.parse("TRANSACTION S TXN 2026 009");
  assert(
    "Grammar: Multi-token Record ID (TRANSACTION S TXN 2026 009)",
    compositeSpaced.recordId === "TXN 2026 009" && compositeSpaced.screenMode === "S",
  );

  // 1.10 Unrecognized Function Code Rejection
  const badFuncCmd = cbsCommand.parse("USER INVALID 1001");
  assert(
    "Grammar: Rejects invalid function code token",
    !badFuncCmd.isValid &&
      (badFuncCmd.error?.includes("Unrecognized function or argument") ?? false),
  );

  // ============================================================================
  // --- 2. Comma Version Auto-Auth Direct Entry ---
  // ============================================================================
  console.log("\n--- 2. Comma Version Auto-Auth Direct Entry ---");

  // 2.1 Pure Trailing Comma (Zero-Auth / Auto-Auth mode)
  const autoAuthBase = cbsCommand.parse("USER,");
  assert(
    "CommaVersion: Pure Trailing Comma (USER,)",
    autoAuthBase.isCommaVersion === true &&
      autoAuthBase.authLevel === 0 &&
      autoAuthBase.screenMode === "I" &&
      autoAuthBase.functionCode === "I",
  );

  // 2.2 Trailing Comma with Record ID
  const autoAuthRecord = cbsCommand.parse("USER, 1001");
  assert(
    "CommaVersion: Trailing Comma with Record ID (USER, 1001)",
    autoAuthRecord.isCommaVersion === true &&
      autoAuthRecord.authLevel === 0 &&
      autoAuthRecord.recordId === "1001" &&
      autoAuthRecord.screenMode === "I",
  );

  // 2.3 Trailing Comma with Explicit Function Code
  const autoAuthFunc = cbsCommand.parse("USER, A 1001");
  assert(
    "CommaVersion: Trailing Comma with Authorize Function (USER, A 1001)",
    autoAuthFunc.isCommaVersion === true &&
      autoAuthFunc.authLevel === 0 &&
      autoAuthFunc.functionCode === "A" &&
      autoAuthFunc.recordId === "1001",
  );

  // 2.4 Trailing Comma with Explicit Function without Record ID
  const autoAuthFuncOnly = cbsCommand.parse("USER, S");
  assert(
    "CommaVersion: Trailing Comma with Function Only (USER, S)",
    autoAuthFuncOnly.isCommaVersion === true &&
      autoAuthFuncOnly.authLevel === 0 &&
      autoAuthFuncOnly.functionCode === "S" &&
      autoAuthFuncOnly.recordId === undefined,
  );

  // ============================================================================
  // --- 3. Inquiry Query Parsing (INQ / INQUIRY) ---
  // ============================================================================
  console.log("\n--- 3. Inquiry Query Parsing ---");

  // 3.1 Standard Inquiry Prefix
  const standardInq = cbsCommand.parse("INQ GET.EMP.INFO");
  assert(
    "Inquiry: Standard INQ Prefix (INQ GET.EMP.INFO)",
    standardInq.type === "INQUIRY" &&
      standardInq.application === "GET.EMP.INFO" &&
      standardInq.screenMode === "S" &&
      standardInq.authLevel === 1,
  );

  // 3.2 Full Keyword Prefix
  const fullInq = cbsCommand.parse("INQUIRY GET.CUSTOMER.PORTFOLIO");
  assert(
    "Inquiry: Full INQUIRY Prefix",
    fullInq.type === "INQUIRY" &&
      fullInq.application === "GET.CUSTOMER.PORTFOLIO" &&
      fullInq.screenMode === "S",
  );

  // 3.3 Explicit Function Code in Inquiry
  const inqWithFunc = cbsCommand.parse("INQ S GET.CUSTOMER");
  assert(
    "Inquiry: Function Code in Inquiry (INQ S GET.CUSTOMER)",
    inqWithFunc.type === "INQUIRY" &&
      inqWithFunc.functionCode === "S" &&
      inqWithFunc.application === "GET.CUSTOMER",
  );

  // 3.4 Multi-word Inquiry Query
  const multiWordInq = cbsCommand.parse("INQ ACTIVE CUSTOMER LIST");
  assert("Inquiry: Multi-word Query Target", multiWordInq.application === "ACTIVE CUSTOMER LIST");

  // 3.5 Case Insensitivity in Inquiry
  const lowerInq = cbsCommand.parse("inq s get.cust");
  assert(
    "Inquiry: Lowercase Query Parsed Uppercase",
    lowerInq.application === "GET.CUST" && lowerInq.functionCode === "S",
  );

  // ============================================================================
  // --- 4. Settings & System Quick Actions ---
  // ============================================================================
  console.log("\n--- 4. Settings & System Quick Actions ---");

  // 4.1 Settings Modal Tabs
  const profileSettings = cbsCommand.parse("SETTINGS:PROFILE");
  assert(
    "Settings: SETTINGS:PROFILE tab",
    profileSettings.type === "SETTINGS" && profileSettings.settingsTabId === "profile",
  );

  const appearanceSettings = cbsCommand.parse("SETTINGS:APPEARANCE");
  assert(
    "Settings: SETTINGS:APPEARANCE tab",
    appearanceSettings.type === "SETTINGS" && appearanceSettings.settingsTabId === "appearance",
  );

  const securitySettings = cbsCommand.parse("setting>security");
  assert(
    "Settings: setting>security alternate syntax",
    securitySettings.type === "SETTINGS" && securitySettings.settingsTabId === "security",
  );

  // 4.2 Direct Settings Aliases
  assert("Settings Alias: PROFILE", cbsCommand.parse("PROFILE").settingsTabId === "profile");
  assert("Settings Alias: SECURITY", cbsCommand.parse("SECURITY").settingsTabId === "security");
  assert(
    "Settings Alias: THEME -> appearance",
    cbsCommand.parse("THEME").settingsTabId === "appearance",
  );

  // 4.3 System Quick Action Syntax & Aliases
  const themeAction = cbsCommand.parse("ACTION:TOGGLE_THEME");
  assert(
    "Action: ACTION:TOGGLE_THEME",
    themeAction.type === "ACTION" && themeAction.actionId === "toggle_theme",
  );

  const logoutAction = cbsCommand.parse("ACTION:LOGOUT");
  assert(
    "Action: ACTION:LOGOUT",
    logoutAction.type === "ACTION" && logoutAction.actionId === "logout",
  );

  assert(
    "Action Alias: DARK -> toggle_theme",
    cbsCommand.parse("DARK").actionId === "toggle_theme",
  );
  assert("Action Alias: LOGOUT -> logout", cbsCommand.parse("LOGOUT").actionId === "logout");
  assert("Action Alias: EXIT -> logout", cbsCommand.parse("EXIT").actionId === "logout");

  // ============================================================================
  // --- 5. Registry, Aliases, Catalog & Dynamic Menu Extraction ---
  // ============================================================================
  console.log("\n--- 5. Registry, Aliases, Catalog & Dynamic Menu Extraction ---");

  // 5.1 Static Canonical Shorthand Aliases
  assert("Alias: MD -> SC.MENU.DESIGN", resolveCommandAlias("MD") === "SC.MENU.DESIGN");
  assert(
    "Alias: SC.MENU.TREE -> SC.MENU.DESIGN",
    resolveCommandAlias("SC.MENU.TREE") === "SC.MENU.DESIGN",
  );
  assert("Alias: MC -> SC.MODEL.CONFIG", resolveCommandAlias("MC") === "SC.MODEL.CONFIG");
  assert(
    "Alias: SC.MODEL.BUILDER -> SC.MODEL.CONFIG",
    resolveCommandAlias("SC.MODEL.BUILDER") === "SC.MODEL.CONFIG",
  );
  assert("Alias: FC -> SC.FORM.CONFIG", resolveCommandAlias("FC") === "SC.FORM.CONFIG");
  assert(
    "Alias: SC.FORM.BUILDER -> SC.FORM.CONFIG",
    resolveCommandAlias("SC.FORM.BUILDER") === "SC.FORM.CONFIG",
  );
  assert("Alias: IC -> SC.INQUIRY.CONFIG", resolveCommandAlias("IC") === "SC.INQUIRY.CONFIG");
  assert(
    "Alias: SC.INQUIRY -> SC.INQUIRY.CONFIG",
    resolveCommandAlias("SC.INQUIRY") === "SC.INQUIRY.CONFIG",
  );

  // 5.2 Case Insensitive & Unknown Alias Handling
  assert("Alias: Lowercase md resolves", resolveCommandAlias("md") === "SC.MENU.DESIGN");
  assert(
    "Alias: Unknown command returns verbatim",
    resolveCommandAlias("CUSTOM.MODULE") === "CUSTOM.MODULE",
  );
  assert("Alias: Empty string returns empty", resolveCommandAlias("") === "");

  // 5.3 Parsing Shorthand Alias Yields Canonical Application
  const parsedAliasMD = cbsCommand.parse("MD");
  assert(
    "Grammar: Alias MD parses into SC.MENU.DESIGN",
    parsedAliasMD.application === "SC.MENU.DESIGN" && parsedAliasMD.screenMode === "IDLE",
  );

  // 5.4 Canonical Screen Key Resolver (getCanonicalScreenKey)
  assert("ScreenKey: Registered alias MD", getCanonicalScreenKey("MD") === "SC.MENU.DESIGN");
  assert(
    "ScreenKey: Canonical SC.MENU.DESIGN",
    getCanonicalScreenKey("SC.MENU.DESIGN") === "SC.MENU.DESIGN",
  );
  assert(
    "ScreenKey: Unregistered returns undefined",
    getCanonicalScreenKey("NOT_A_SCREEN") === undefined,
  );

  // 5.5 Catalog Title Resolver (resolveCommandTitle)
  assert("Title: MD -> Menu Hierarchy", resolveCommandTitle("MD") === "Menu Hierarchy");
  assert(
    "Title: SC.MODEL.CONFIG -> Model Config",
    resolveCommandTitle("SC.MODEL.CONFIG") === "Model Config",
  );
  assert("Title: Unknown returns undefined", resolveCommandTitle("NON_EXISTENT") === undefined);

  // 5.6 Master Catalog Definitions Integrity
  const allCommands = getAllRegisteredCommands();
  assert("Catalog: MASTER_COMMAND_DEFINITIONS registered", allCommands.length >= 8);
  assert(
    "Catalog: Facade getCommands matches",
    cbsCommand.getCommands().length === allCommands.length,
  );

  // 5.7 Dynamic Menu Hierarchy Extractor (extractMenuCommands)
  const mockMenuTree: MenuItem[] = [
    {
      id: "folder_1",
      menuId: 100,
      label: "Customer Services",
      children: [
        { id: "item_1", menuId: 101, label: "Individual Customer", command: "CUSTOMER I" },
        {
          id: "item_2",
          menuId: 102,
          label: "Customer Portfolio",
          command: "INQ GET.CUST.PORTFOLIO",
        },
      ],
    },
    {
      id: "item_3",
      menuId: 200,
      label: "Account Opening",
      command: "ACCOUNT I",
    },
  ];

  const extracted = extractMenuCommands(mockMenuTree);
  assert("MenuExtract: Extracts only nodes with command property", extracted.length === 3);
  assert(
    "MenuExtract: Traverses nested children",
    extracted.some((c) => c.command === "CUSTOMER I") &&
      extracted.some((c) => c.command === "ACCOUNT I"),
  );

  // ============================================================================
  // --- 6. Pre-Execution RBAC Security Validator ---
  // ============================================================================
  console.log("\n--- 6. Pre-Execution RBAC Security Validator ---");

  // 6.1 Syntax Check Precedence
  const syntaxFailResult = validateSecurityPermissions(invalidAppCmd, {
    commandLine: true,
    accessibility: "RIDASH",
  });
  assert(
    "RBAC: Grammatically invalid command blocked at validation",
    syntaxFailResult.allowed === false,
  );

  // 6.2 Settings & Actions Are Universally Allowed
  const settingsValidation = validateSecurityPermissions(profileSettings, null);
  assert("RBAC: Settings allowed even without user session", settingsValidation.allowed === true);

  const actionValidation = validateSecurityPermissions(logoutAction, { commandLine: false });
  assert("RBAC: Actions allowed even when commandLine is false", actionValidation.allowed === true);

  // 6.3 Anonymous / Null Session Rejection
  const unauthValidation = validateSecurityPermissions(baseApp, null);
  assert(
    "RBAC: Null user session rejected for forms",
    unauthValidation.allowed === false &&
      (unauthValidation.reason?.includes("No active user session") ?? false),
  );

  // 6.4 Terminal Command Line Disabled
  const noTerminalUser: UserSecurityProfile = {
    userId: "TELLER_GUEST",
    commandLine: false,
    accessibility: "RIDASH",
  };
  const terminalBlocked = validateSecurityPermissions(baseApp, noTerminalUser);
  assert(
    "RBAC: User with commandLine: false is denied",
    terminalBlocked.allowed === false &&
      (terminalBlocked.reason?.includes("Command Line access") ?? false),
  );

  // 6.5 Base Idle Command Permitted for Authorized Terminal User
  const standardUser: UserSecurityProfile = {
    userId: "TELLER_STANDARD",
    commandLine: true,
    accessibility: "RS",
  };
  const baseAllowed = validateSecurityPermissions(baseApp, standardUser);
  assert("RBAC: Base IDLE form allowed without function check", baseAllowed.allowed === true);

  // 6.6 Full RIDASH Access Clearance
  const adminUser: UserSecurityProfile = {
    userId: "ADMIN_OFFICER",
    commandLine: true,
    accessibility: "RIDASH",
  };
  const inputCmd = cbsCommand.parse("ACCOUNT I 1001");
  const authCmd = cbsCommand.parse("ACCOUNT A 1001");
  const delCmd = cbsCommand.parse("ACCOUNT D 1001");
  const revCmd = cbsCommand.parse("ACCOUNT R 1001");
  const holdCmd = cbsCommand.parse("ACCOUNT H 1001");

  assert(
    "RBAC: RIDASH user permitted for Input (I)",
    validateSecurityPermissions(inputCmd, adminUser).allowed === true,
  );
  assert(
    "RBAC: RIDASH user permitted for Authorize (A)",
    validateSecurityPermissions(authCmd, adminUser).allowed === true,
  );
  assert(
    "RBAC: RIDASH user permitted for Delete (D)",
    validateSecurityPermissions(delCmd, adminUser).allowed === true,
  );
  assert(
    "RBAC: RIDASH user permitted for Reverse (R)",
    validateSecurityPermissions(revCmd, adminUser).allowed === true,
  );
  assert(
    "RBAC: RIDASH user permitted for History/Hold (H)",
    validateSecurityPermissions(holdCmd, adminUser).allowed === true,
  );

  // 6.7 Restricted Accessibility Rights ("RS" - Read & See only)
  const readOnlyUser: UserSecurityProfile = {
    userId: "AUDITOR1",
    commandLine: true,
    accessibility: "RS",
  };

  const seeCmd = cbsCommand.parse("ACCOUNT S 1001");
  assert(
    "RBAC: 'RS' user permitted for See (S)",
    validateSecurityPermissions(seeCmd, readOnlyUser).allowed === true,
  );

  const deniedInput = validateSecurityPermissions(inputCmd, readOnlyUser);
  assert(
    "RBAC: 'RS' user denied Input (I)",
    deniedInput.allowed === false &&
      deniedInput.requiredRight === "I" &&
      (deniedInput.reason?.includes("Insert / Update") ?? false),
  );

  const deniedAuth = validateSecurityPermissions(authCmd, readOnlyUser);
  assert(
    "RBAC: 'RS' user denied Authorize (A)",
    deniedAuth.allowed === false &&
      deniedAuth.requiredRight === "A" &&
      (deniedAuth.reason?.includes("Authorize") ?? false),
  );

  const deniedDelete = validateSecurityPermissions(delCmd, readOnlyUser);
  assert(
    "RBAC: 'RS' user denied Delete (D)",
    deniedDelete.allowed === false &&
      deniedDelete.requiredRight === "D" &&
      (deniedDelete.reason?.includes("Delete") ?? false),
  );

  // 6.8 Explicit functionRights Array Precedence
  const customRightsUser: UserSecurityProfile = {
    userId: "SUPERVISOR1",
    commandLine: true,
    accessibility: "RS", // string says only RS
    functionRights: ["S", "I", "A"], // explicit array adds I and A
  };
  assert(
    "RBAC: Explicit functionRights array overrides accessibility string",
    validateSecurityPermissions(authCmd, customRightsUser).allowed === true,
  );
  assert(
    "RBAC: Explicit functionRights still denies unlisted rights",
    validateSecurityPermissions(delCmd, customRightsUser).allowed === false,
  );

  // ============================================================================
  // --- 7. Command Execution Router & Dispatcher (cbsCommand.execute) ---
  // ============================================================================
  console.log("\n--- 7. Command Execution Router & Dispatcher ---");

  // 7.1 Syntax Failure Handling
  let capturedError = "";
  const failedExec = cbsCommand.execute("$$$BAD", {
    silent: true,
    onError: (err) => {
      capturedError = err;
    },
  });
  assert(
    "Executor: Syntax failure returns invalid AST and fires onError",
    failedExec.isValid === false && capturedError.length > 0,
  );

  // 7.2 RBAC Clearance Failure Handling
  let securityError = "";
  const deniedExec = cbsCommand.execute("ACCOUNT D 1001", {
    silent: true,
    user: readOnlyUser,
    onError: (err) => {
      securityError = err;
    },
  });
  assert(
    "Executor: RBAC denial returns invalid command and fires onError",
    deniedExec.isValid === false && securityError.includes("Delete"),
  );

  // 7.3 Workspace Tab Dispatching via Adapter
  const openedTabs: CommandTabPayload[] = [];
  const executionState = {
    logoutCalled: false,
  };

  const unregister = registerCommandAdapter({
    getCurrentUser: () => adminUser,
    openTab: (tab) => {
      openedTabs.push(tab);
    },
    logout: () => {
      executionState.logoutCalled = true;
    },
  });

  // Verify adapter is active
  assert(
    "Adapter: registerCommandAdapter successfully registers active adapter",
    getCommandAdapter().getCurrentUser?.()?.userId === "ADMIN_OFFICER",
  );

  // Execute standard form tab
  let successDispatched: ParsedCommand | undefined;
  cbsCommand.execute("ACCOUNT I 10001", {
    silent: true,
    formData: { initialBalance: 5000 },
    onSuccess: (cmd) => {
      successDispatched = cmd;
    },
  });

  assert("Executor: Form tab dispatched to openTab", openedTabs.length === 1);
  assert(
    "Executor: Form tab payload structure",
    openedTabs[0]?.screenId === "ACCOUNT" &&
      openedTabs[0]?.componentName === "DYNAMIC_FORM" &&
      openedTabs[0]?.screenMode === "I" &&
      openedTabs[0]?.searchRecordId === "10001" &&
      (openedTabs[0]?.formData as Record<string, unknown>)?.initialBalance === 5000,
  );
  assert(
    "Executor: onSuccess callback received dispatched command",
    Boolean(successDispatched && successDispatched.application === "ACCOUNT"),
  );

  // Execute named version form tab
  cbsCommand.execute("ACCOUNT,VIP I 20002", { silent: true });
  assert(
    "Executor: Named version generates correct screenId 'ACCOUNT,VIP'",
    openedTabs[1]?.screenId === "ACCOUNT,VIP",
  );

  // Execute Inquiry tab
  cbsCommand.execute("INQ CUSTOMER.LIST", {
    silent: true,
    step: "RESULTS",
    currentPage: 2,
    pageSize: 25,
    criteria: { branch: { value: "001", operand: "EQ" } },
  });

  assert("Executor: Inquiry tab dispatched to openTab", openedTabs.length === 3);
  assert(
    "Executor: Inquiry tab payload structure",
    openedTabs[2]?.screenId === "INQ CUSTOMER.LIST" &&
      openedTabs[2]?.componentName === "INQUIRY_SCREEN" &&
      openedTabs[2]?.enquiryState?.step === "RESULTS" &&
      openedTabs[2]?.enquiryState?.currentPage === 2 &&
      openedTabs[2]?.enquiryState?.pageSize === 25 &&
      openedTabs[2]?.enquiryState?.criteria?.branch?.value === "001",
  );

  // 7.4 Non-Screen Actions Dispatching
  cbsCommand.execute("LOGOUT", { silent: true });
  assert("Executor: Action LOGOUT invokes adapter.logout()", executionState.logoutCalled);

  // 7.5 Detached Popup Target & Session Storage Staging
  const originalWindow = (globalThis as unknown as Record<string, unknown>).window;
  const originalSessionStorage = (globalThis as unknown as Record<string, unknown>).sessionStorage;
  let openedUrl = "";
  let openedFeatures = "";
  const mockStorage = new Map<string, string>();

  const storageShim = {
    setItem: (key: string, val: string) => mockStorage.set(key, val),
    getItem: (key: string) => mockStorage.get(key) ?? null,
  };

  (globalThis as unknown as Record<string, unknown>).window = {
    open: (url: string, _name: string, features: string) => {
      openedUrl = url;
      openedFeatures = features;
      return { focus: () => {} };
    },
    sessionStorage: storageShim,
    dispatchEvent: () => true,
  };
  (globalThis as unknown as Record<string, unknown>).sessionStorage = storageShim;

  try {
    cbsCommand.execute("ACCOUNT I 10001", {
      silent: true,
      target: "popup",
      tabId: "popup_test_tab_01",
      formData: { accountTitle: "Corporate Savings" },
      criteria: { currency: { value: "BDT", operand: "EQ" } },
    });

    assert("Executor: Popup target triggers window.open", openedUrl.includes("/screen/ACCOUNT"));
    assert(
      "Executor: Popup features specify dimensions",
      openedFeatures.includes("width=1160") && openedFeatures.includes("height=800"),
    );

    const stagedDraftKey = clientConfig.storage.session.draft("popup_test_tab_01");
    assert(
      "Executor: Popup stages large form payload in sessionStorage draft",
      mockStorage.get(stagedDraftKey)?.includes("Corporate Savings") === true,
    );

    const stagedCriteriaKey = clientConfig.storage.session.criteria("popup_test_tab_01");
    assert(
      "Executor: Popup stages query criteria in sessionStorage",
      mockStorage.get(stagedCriteriaKey)?.includes("BDT") === true,
    );
  } finally {
    (globalThis as unknown as Record<string, unknown>).window = originalWindow;
    (globalThis as unknown as Record<string, unknown>).sessionStorage = originalSessionStorage;
  }

  // 7.6 Adapter Teardown
  unregister();
  assert("Adapter: Unregister restores empty adapter", getCommandAdapter().openTab === undefined);

  // ============================================================================
  // --- Master Summary ---
  // ============================================================================
  console.log("\n========================================================");
  const allPassed = reports.every((r) => r.passed);
  if (allPassed) {
    console.log(`ALL ${reports.length} COMMAND GATEWAY TEST CASES PASSED WITH 100% SUCCESS!`);
  } else {
    const failedCount = reports.filter((r) => !r.passed).length;
    console.error(`FAILED: ${failedCount} OF ${reports.length} TESTS FAILED!`);
    process.exit(1);
  }
  console.log("========================================================\n");
}

runSuite().catch((err: unknown) => {
  console.error("Fatal Test Suite Crash:", err);
  process.exit(1);
});
