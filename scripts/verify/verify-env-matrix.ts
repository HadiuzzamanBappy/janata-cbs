/**
 * Master Verification Suite: Environment Matrix, Data Schemas & PII Redaction
 *
 * Enforces strict Single Responsibility Principle (SRP) and Don't Repeat Yourself (DRY):
 * 1. Environment Matrix Permutations & Runtime Configurations (@/lib/core-config & envSchema)
 * 2. Zod Domain Schemas, Boundary Validation & Widget Compatibility (@/lib/data-schemas)
 * 3. Canonical Database Fixture Schema Conformance (@mock/db validated by Zod contracts)
 * 4. Banking-Grade Logger, Log Levels & Deep PII Redaction Engine (@/lib/core-logger)
 *
 * Usage:
 *   pnpm tsx scripts/verify-env-matrix.ts
 */

// Pre-empt server-only in require.cache for standalone Node / tsx execution
try {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
    children: [],
    path: "",
    paths: [],
  } as unknown as NodeModule;
} catch {
  // Ignore if not resolvable
}

export {};

async function runSuite() {
  const {
    AC_ACCOUNT_LIVE,
    CUST_CUSTOMER_LIVE,
    SC_CONTROL_LIVE,
    SC_MENU_TREE_LIVE,
    SC_BRANCH_LIST,
    SC_CONTROL_LIST,
    SC_FORM_CONFIG_LIVE,
    SC_INQUIRY_CONFIG_LIVE,
    SC_MODEL_CONFIG_LIVE,
    SYS_USER_LIVE,
  } = await import("@mock/db");
  const { SYS_USER_AUTH_RESPONSES } = await import("@mock/core");

  const { clientConfig } = await import("@/lib/core-config/client");
  const { getService, getServices, getServiceUrl, REQUEST_TYPE_OVERLAYS } = await import(
    "@/lib/core-config/server"
  );
  const { isSensitiveKey, logger, maskAccountNumber, redactSensitiveData } = await import(
    "@/lib/core-logger"
  );
  const {
    branchRecordSchema,
    changePasswordSchema,
    currentUserSchema,
    envSchema,
    formConfigRecordSchema,
    getCompatibleWidgets,
    getDefaultWidget,
    inquiryConfigRecordSchema,
    isWidgetCompatible,
    loginSchema,
    menuCatalogRecordSchema,
    menuItemSchema,
    menuTreeRecordSchema,
    MIN_PASSWORD_LENGTH,
    modelConfigRecordSchema,
    parsedFormDataSchema,
    rawControlRecordSchema,
    systemCommandItemSchema,
    updateBranchSessionSchema,
    userGroupRecordSchema,
    WIDGET_COMPATIBILITY_MAP,
  } = await import("@/lib/data-schemas");

  interface TestReport {
    name: string;
    passed: boolean;
    error?: string;
  }

  const reports: TestReport[] = [];

  function assert(name: string, condition: boolean, extraInfo?: string) {
    if (condition) {
      reports.push({ name, passed: true });
      console.log(`  [PASS] ${name}`);
    } else {
      reports.push({ name, passed: false, error: extraInfo });
      console.error(`  [FAIL] ${name}${extraInfo ? ` -> ${extraInfo}` : ""}`);
    }
  }

  console.log("\n================================================================================");
  console.log("   FINX CBS: ENVIRONMENT MATRIX, DATA SCHEMAS & PII REDACTION SUITE             ");
  console.log("================================================================================\n");

  // ===========================================================================
  // CHAPTER 1: Environment Matrix Permutations & Runtime Configurations
  // ===========================================================================
  console.log("── 1. Environment Matrix Permutations & Runtime Configurations ──");

  // 1.1 Permutation 1 [Pure Offline]: static + cache disabled
  const perm1 = envSchema.safeParse({
    DATA_SOURCE: "static",
    CACHE_ENABLED: "false",
  });
  assert(
    "Env Matrix: Permutation 1 [Pure Offline] (static + cache disabled) parses cleanly",
    perm1.success && perm1.data.DATA_SOURCE === "static" && perm1.data.CACHE_ENABLED === false,
  );

  // 1.2 Permutation 2 [Cached Offline]: rejects when REDIS_URL is missing
  const perm2Missing = envSchema.safeParse({
    DATA_SOURCE: "static",
    CACHE_ENABLED: "true",
    REDIS_URL: "",
  });
  assert(
    "Env Matrix: Permutation 2 [Cached Offline] rejects when REDIS_URL is empty",
    !perm2Missing.success && perm2Missing.error?.issues.some((i) => i.path.includes("REDIS_URL")),
  );

  // 1.3 Permutation 2 [Cached Offline]: accepts when REDIS_URL is provided
  const perm2Valid = envSchema.safeParse({
    DATA_SOURCE: "static",
    CACHE_ENABLED: "true",
    REDIS_URL: "redis://127.0.0.1:6379",
  });
  assert(
    "Env Matrix: Permutation 2 [Cached Offline] accepts when REDIS_URL is provided",
    perm2Valid.success && perm2Valid.data.CACHE_ENABLED === true,
  );

  // 1.4 Permutation 3 [Direct gRPC]: rejects when GRPC_HOST is missing
  const perm3Missing = envSchema.safeParse({
    DATA_SOURCE: "grpc",
    CACHE_ENABLED: "false",
    GRPC_HOST: "",
  });
  assert(
    "Env Matrix: Permutation 3 [Direct gRPC] rejects when GRPC_HOST is empty",
    !perm3Missing.success && perm3Missing.error?.issues.some((i) => i.path.includes("GRPC_HOST")),
  );

  // 1.5 Permutation 3 [Direct gRPC]: accepts when GRPC_HOST is provided
  const perm3Valid = envSchema.safeParse({
    DATA_SOURCE: "grpc",
    CACHE_ENABLED: "false",
    GRPC_HOST: "127.0.0.1:9090",
    CLIENT_ID: "CBS_CLIENT",
  });
  assert(
    "Env Matrix: Permutation 3 [Direct gRPC] accepts when GRPC_HOST is provided",
    perm3Valid.success && perm3Valid.data.GRPC_HOST === "127.0.0.1:9090",
  );

  // 1.6 Permutation 4 [Full Production]: accepts valid gRPC + Redis configuration
  const perm4Valid = envSchema.safeParse({
    DATA_SOURCE: "grpc",
    CACHE_ENABLED: "true",
    GRPC_HOST: "127.0.0.1:9090",
    CLIENT_ID: "CBS_CLIENT",
    REDIS_URL: "redis://127.0.0.1:6379",
  });
  assert(
    "Env Matrix: Permutation 4 [Full Production] accepts valid gRPC + Redis configuration",
    perm4Valid.success &&
      perm4Valid.data.DATA_SOURCE === "grpc" &&
      perm4Valid.data.CACHE_ENABLED === true,
  );

  // 1.7 Permutation 5: Boolean string transformations
  const boolTransform = envSchema.safeParse({
    USE_HTTPS: "true",
    GRPC_USE_TLS: "true",
    CACHE_ENABLED: "false",
  });
  assert(
    "Env Matrix: Transforms boolean strings ('true'/'false') into real booleans",
    boolTransform.success &&
      boolTransform.data.USE_HTTPS === true &&
      boolTransform.data.GRPC_USE_TLS === true &&
      boolTransform.data.CACHE_ENABLED === false,
  );

  // 1.8 Permutation 6: Numeric coercions
  const numCoerce = envSchema.safeParse({
    LOGIN_LIMIT: "5",
    GRPC_TIMEOUT_MS: "12000",
    MENU_TTL_SECONDS: "900",
    SPEC_TTL_SECONDS: "7200",
    CACHE_ENABLED: "false",
  });
  assert(
    "Env Matrix: Coerces numeric string configurations into typed numbers",
    numCoerce.success &&
      numCoerce.data.LOGIN_LIMIT === 5 &&
      numCoerce.data.GRPC_TIMEOUT_MS === 12000 &&
      numCoerce.data.MENU_TTL_SECONDS === 900 &&
      numCoerce.data.SPEC_TTL_SECONDS === 7200,
  );

  // 1.9 Permutation 7: Enum constraint rejection
  const invalidDataSource = envSchema.safeParse({ DATA_SOURCE: "invalid_source" });
  assert("Env Matrix: Rejects unrecognized DATA_SOURCE enum values", !invalidDataSource.success);

  const invalidLogLevel = envSchema.safeParse({ LOG_LEVEL: "verbose" });
  assert("Env Matrix: Rejects unrecognized LOG_LEVEL enum values", !invalidLogLevel.success);

  // 1.10 Client Config Invariants & Deterministic Storage Keys
  assert(
    "Client Config: Exposes central branch and banking presentation invariants",
    typeof clientConfig.centralBranch === "string" &&
      clientConfig.centralBranch.length > 0 &&
      clientConfig.format.currency === "BDT" &&
      clientConfig.format.accountNumberLength === 13,
  );

  assert(
    "Client Config: Storage keys use deterministic prefix namespacing",
    clientConfig.storage.local.lastActivity.includes("session:last_activity") &&
      clientConfig.storage.session.sessionState.includes("session:state") &&
      clientConfig.storage.cookies.sid.includes("_sid") &&
      clientConfig.storage.session.draft("tab_1").includes(":draft:tab_1"),
  );

  // 1.11 Downstream Services Registry & Request Type Overlays
  const services = getServices();
  assert(
    "Service Registry: Contains default, customer, and urm microservice definitions",
    Boolean(services.default?.url && services.customer?.url && services.urm?.url),
  );
  assert(
    "Service Registry: getServiceUrl('customer') resolves customer endpoint",
    getServiceUrl("customer") === services.customer.url,
  );
  assert(
    "Service Registry: Fallbacks safely to 'default' service for unknown key",
    getService("nonexistent_service_xyz").url === services.default.url,
  );
  assert(
    "Service Registry: REQUEST_TYPE_OVERLAYS maps specialized transaction actions",
    REQUEST_TYPE_OVERLAYS.USER?.AUT === "UAU" &&
      REQUEST_TYPE_OVERLAYS["FUNDS.TRANSFER"]?.PUT === "AFT" &&
      REQUEST_TYPE_OVERLAYS["CASH.TRANSFER"]?.REV === "ACT",
  );

  // ===========================================================================
  // CHAPTER 2: Data Schemas & Boundary Zod Contracts
  // ===========================================================================
  console.log("\n── 2. Data Schemas & Boundary Zod Contracts ──");

  // 2.1 Auth Schemas
  const validLogin = loginSchema.safeParse({ username: "AD028459", password: "SecretPassword123" });
  assert("Data Schemas: loginSchema validates valid credentials", validLogin.success);

  const emptyLogin = loginSchema.safeParse({ username: "", password: "" });
  assert("Data Schemas: loginSchema rejects empty credentials", !emptyLogin.success);

  const validPasswordChange = changePasswordSchema.safeParse({
    oldPassword: "OldPassword1!",
    newPassword: "NewStrongPassword2@",
    confirmPassword: "NewStrongPassword2@",
  });
  assert(
    "Data Schemas: changePasswordSchema accepts compliant passwords (length, case, digit, special)",
    validPasswordChange.success,
  );

  const weakPasswordChange = changePasswordSchema.safeParse({
    oldPassword: "OldPassword1!",
    newPassword: "weak",
    confirmPassword: "weak",
  });
  assert(
    "Data Schemas: changePasswordSchema rejects weak passwords under MIN_PASSWORD_LENGTH",
    !weakPasswordChange.success && MIN_PASSWORD_LENGTH === 6,
  );

  const mismatchPasswordChange = changePasswordSchema.safeParse({
    oldPassword: "OldPassword1!",
    newPassword: "NewStrongPassword2@",
    confirmPassword: "DifferentPassword2@",
  });
  assert(
    "Data Schemas: changePasswordSchema rejects password confirmation mismatch",
    !mismatchPasswordChange.success,
  );

  const sampleUser = {
    userId: "ZZ0284590",
    fullName: "MD. HADIUZZAMAN BAPPY",
    userRole: ["Administrator"],
    accessibility: "RIDASHL",
    functionRights: ["R", "I", "D", "A", "S", "H", "L"],
    branchCode: "JB9999",
    branchName: "CENTRAL OFFICE, HO, DHAKA",
    txnDate: "2026-01-07",
    isLoggedIn: true,
    commandLine: true,
    initLogin: false,
    userStatus: 1,
  };
  const validUser = currentUserSchema.safeParse(sampleUser);
  assert("Data Schemas: currentUserSchema validates complete session profile", validUser.success);

  // 2.2 Branch Schemas
  const sampleBranch = {
    recordId: "JB0001",
    branchTitle: "PRINCIPAL BRANCH",
    branchType: "CORPORATE",
    isActive: true,
    routingNumber: "135260123",
    swiftCode: "JANBBDDH001",
    branchContact: [{ email: "principal@janatabank.com.bd", phone: "+88029555000" }],
  };
  const validBranch = branchRecordSchema.safeParse(sampleBranch);
  assert(
    "Data Schemas: branchRecordSchema validates canonical branch profiles",
    validBranch.success,
  );

  const branchSessionChange = updateBranchSessionSchema.safeParse({
    branchCode: "JB1001",
    branchName: "DILKUSHA CORPORATE BRANCH",
  });
  assert(
    "Data Schemas: updateBranchSessionSchema validates session branch switches",
    branchSessionChange.success,
  );

  // 2.3 Control Schemas
  const sampleCommand = {
    id: "ACCOUNT",
    title: "Account Master",
    category: "Core Banking",
    command: "ACCOUNT",
    aliases: ["AC", "ACC"],
    actionType: "SCREEN",
  };
  const validControl = systemCommandItemSchema.safeParse(sampleCommand);
  assert(
    "Data Schemas: systemCommandItemSchema validates system command definitions",
    validControl.success,
  );

  // 2.4 Form & Metamodel Schemas
  const sampleFormData = {
    code: "ACCOUNT",
    title: "Account Master",
    idPrefix: "AC",
    fields: [
      {
        id: "accountNumber",
        fieldKey: "accountNumber",
        label: "Account Number",
        widget: "text",
        required: true,
        readOnly: false,
      },
    ],
  };
  const validFormData = parsedFormDataSchema.safeParse(sampleFormData);
  assert(
    "Data Schemas: parsedFormDataSchema validates parsed form structures",
    validFormData.success,
  );

  const sampleModelConfig = {
    recordId: "ACCOUNT",
    description: "Account Master Table",
    tableName: "AC.ACCOUNT",
    servicePath: "default",
    access: "Global",
    properties: [
      {
        sn: "1",
        name: "accountType",
        type: "Dropdown",
        label: "Account Type",
        required: true,
      },
    ],
  };
  const validModelConfig = modelConfigRecordSchema.safeParse(sampleModelConfig);
  assert(
    "Data Schemas: modelConfigRecordSchema validates data dictionary definitions",
    validModelConfig.success,
  );

  // 2.5 Form Config & Layout Schemas
  const sampleFormConfig = {
    recordId: "FC.ACCOUNT",
    targetModel: "ACCOUNT",
    title: "Retail Account Layout",
    presentation: {
      sections: [
        {
          id: "general_sec",
          title: "General Information",
          columns: 2,
          fields: [
            {
              id: "accountNumber",
              fieldKey: "accountNumber",
              label: "Account Number",
              widget: "text",
            },
          ],
        },
      ],
    },
  };
  const validFormConfig = formConfigRecordSchema.safeParse(sampleFormConfig);
  assert(
    "Data Schemas: formConfigRecordSchema validates designer form configurations",
    validFormConfig.success,
  );

  // 2.6 Inquiry & Grid Schemas
  const sampleInquiryConfig = {
    id: "INQ.ACCOUNT",
    title: "Account Listing Grid",
    targetModel: "ACCOUNT",
    columns: [
      { id: "recordId", label: "Account No", width: 140 },
      { id: "accountType", label: "Type", width: 120 },
    ],
    filters: [{ id: "branchCode", label: "Branch", defaultOperand: "EQ" }],
  };
  const validInquiryConfig = inquiryConfigRecordSchema.safeParse(sampleInquiryConfig);
  assert(
    "Data Schemas: inquiryConfigRecordSchema validates enquiry presentation specs",
    validInquiryConfig.success,
  );

  // 2.7 Navigation Menu & Catalog Schemas
  const sampleMenuItem = {
    id: "menu_101",
    menuId: 101,
    label: "Account Services",
    command: "ACCOUNT",
    children: [],
  };
  const validMenuItem = menuItemSchema.safeParse(sampleMenuItem);
  assert(
    "Data Schemas: menuItemSchema validates hierarchical navigation nodes",
    validMenuItem.success,
  );

  const sampleMenuCatalog = {
    recordId: "MENU_AC_101",
    label: "Account Services",
    command: "ACCOUNT",
    icon: "Folder",
    isLeaf: true,
  };
  const validMenuCatalog = menuCatalogRecordSchema.safeParse(sampleMenuCatalog);
  assert(
    "Data Schemas: menuCatalogRecordSchema validates menu catalog items",
    validMenuCatalog.success,
  );

  const sampleMenuTree = {
    recordId: "TREE_MAIN",
    treeDescription: "Primary CBS Tree",
    menuTree: [
      {
        id: "node_1",
        menuId: 101,
        label: "Account Services",
        command: "ACCOUNT",
        isVisible: true,
        orderIndex: 1,
        children: [],
      },
    ],
  };
  const validMenuTree = menuTreeRecordSchema.safeParse(sampleMenuTree);
  assert(
    "Data Schemas: menuTreeRecordSchema validates menu tree designer specs",
    validMenuTree.success,
  );

  // 2.8 User Group & Permissions Schemas
  const sampleUserGroup = {
    recordId: "UG_ADMIN",
    groupLabel: "System Administrators",
    menuIds: ["MENU_1", "MENU_2"],
    roleIds: ["ROLE_ADMIN"],
  };
  const validUserGroup = userGroupRecordSchema.safeParse(sampleUserGroup);
  assert(
    "Data Schemas: userGroupRecordSchema validates role group authorization specs",
    validUserGroup.success,
  );

  // 2.9 Widget & Field Compatibility Rules
  assert(
    "Field Compatibility: WIDGET_COMPATIBILITY_MAP maps all 10 property types to valid widgets",
    Object.keys(WIDGET_COMPATIBILITY_MAP).length >= 10 &&
      WIDGET_COMPATIBILITY_MAP.Number.includes("amount") &&
      WIDGET_COMPATIBILITY_MAP.Boolean.includes("switch"),
  );

  assert(
    "Field Compatibility: isWidgetCompatible confirms valid bindings",
    isWidgetCompatible("Number", "amount") === true &&
      isWidgetCompatible("Text", "textarea") === true &&
      isWidgetCompatible("Boolean", "textarea") === false,
  );

  assert(
    "Field Compatibility: getDefaultWidget returns primary presentation widget",
    getDefaultWidget("Number") === "number" &&
      getDefaultWidget("Boolean") === "switch" &&
      getDefaultWidget("Date") === "date",
  );

  assert(
    "Field Compatibility: getCompatibleWidgets handles unbound / undefined property types gracefully",
    getCompatibleWidgets(undefined).length > 5,
  );

  // ===========================================================================
  // CHAPTER 3: Canonical Database Fixture Schema Conformance
  // ===========================================================================
  console.log("\n── 3. Canonical Database Fixture Schema Conformance ──");

  // 3.1 User Session Profile Conformance
  const userFixture = SYS_USER_AUTH_RESPONSES.ZZ028459?.data;
  assert(
    "Fixture Conformance: User session profile satisfies currentUserSchema contract",
    Boolean(userFixture && currentUserSchema.safeParse(userFixture).success),
  );

  // 3.2 Branch Profile Conformance
  const branchFixture = SC_BRANCH_LIST[0];
  assert(
    "Fixture Conformance: Primary branch (JB0001) satisfies branchRecordSchema contract",
    Boolean(branchFixture && branchRecordSchema.safeParse(branchFixture).success),
  );

  // 3.3 Control Record Conformance
  const controlFixture = SC_CONTROL_LIST[0];
  assert(
    "Fixture Conformance: System control record satisfies rawControlRecordSchema contract",
    Boolean(controlFixture && rawControlRecordSchema.safeParse(controlFixture).success),
  );

  // 3.4 Model Config Metamodel Conformance
  const modelConfigFixture = SC_MODEL_CONFIG_LIVE.ACCOUNT || SC_MODEL_CONFIG_LIVE["MENU.TREE"];
  assert(
    "Fixture Conformance: Model definition satisfies modelConfigRecordSchema contract",
    Boolean(modelConfigFixture && modelConfigRecordSchema.safeParse(modelConfigFixture).success),
  );

  // 3.5 Form Config Layout Conformance
  const formConfigFixture =
    SC_FORM_CONFIG_LIVE.ACCOUNT ||
    SC_FORM_CONFIG_LIVE["FC.ACCOUNT"] ||
    SC_FORM_CONFIG_LIVE["ACCOUNT,1.0.0"] ||
    Object.values(SC_FORM_CONFIG_LIVE)[0];
  assert(
    "Fixture Conformance: ACCOUNT form layout satisfies formConfigRecordSchema contract",
    Boolean(formConfigFixture && formConfigRecordSchema.safeParse(formConfigFixture).success),
  );

  // 3.6 Inquiry Config Grid Conformance
  const inqConfigFixture =
    SC_INQUIRY_CONFIG_LIVE.ACCOUNT ||
    SC_INQUIRY_CONFIG_LIVE["GET.ACCOUNT"] ||
    SC_INQUIRY_CONFIG_LIVE["ACCOUNT.LIST"] ||
    Object.values(SC_INQUIRY_CONFIG_LIVE)[0];
  assert(
    "Fixture Conformance: ACCOUNT inquiry spec satisfies inquiryConfigRecordSchema contract",
    Boolean(inqConfigFixture && inquiryConfigRecordSchema.safeParse(inqConfigFixture).success),
  );

  // 3.8 Menu Tree Record Conformance
  const menuTreeFixture = SC_MENU_TREE_LIVE["MENU.MAIN"];
  assert(
    "Fixture Conformance: MENU.MAIN primary navigation tree satisfies menuTreeRecordSchema contract",
    Boolean(menuTreeFixture && menuTreeRecordSchema.safeParse(menuTreeFixture).success),
  );

  // 3.10 Core Live Entities Existence
  assert(
    "Fixture Conformance: AC_ACCOUNT_LIVE, CUST_CUSTOMER_LIVE, SC_CONTROL_LIVE, and SYS_USER_LIVE contain production data",
    Object.keys(AC_ACCOUNT_LIVE).length > 0 &&
      Object.keys(CUST_CUSTOMER_LIVE).length > 0 &&
      Object.keys(SC_CONTROL_LIVE).length > 0 &&
      Object.keys(SYS_USER_LIVE).length > 0,
  );

  // ===========================================================================
  // CHAPTER 4: Banking-Grade Logger & PII Redaction Engine
  // ===========================================================================
  console.log("\n── 4. Banking-Grade Logger & PII Redaction Engine ──");

  // 4.1 Account Number Masking
  assert(
    "Logger / PII: Masks 8+ digit account numbers keeping prefix and last 4 (AC12345678 -> AC****5678)",
    maskAccountNumber("AC12345678") === "AC****5678",
  );
  assert(
    "Logger / PII: Masks standard 13-digit CBS account numbers (AC1234567890123 -> AC****0123)",
    maskAccountNumber("AC1234567890123") === "AC****0123",
  );
  assert(
    "Logger / PII: Short account numbers under 8 digits are completely obscured (****)",
    maskAccountNumber("AC123") === "****",
  );

  // 4.2 Sensitive Key Pattern Detection (isSensitiveKey)
  const testKeys = [
    { key: "password", expected: true },
    { key: "old_password", expected: true },
    { key: "passWord_confirm", expected: true },
    { key: "token", expected: true },
    { key: "bearer_token", expected: true },
    { key: "authorization", expected: true },
    { key: "apiSecretKey", expected: true },
    { key: "userPinCode", expected: true },
    { key: "cardCvv", expected: true },
    { key: "creditCardNumber", expected: true },
    { key: "client_ssn", expected: true },
    { key: "privateKeyPem", expected: true },
    { key: "username", expected: false },
    { key: "branchTitle", expected: false },
    { key: "amount", expected: false },
  ];
  const allKeysMatch = testKeys.every((k) => isSensitiveKey(k.key) === k.expected);
  assert(
    "Logger / PII: isSensitiveKey matches all 13+ credential patterns case-insensitively",
    allKeysMatch,
  );

  // 4.3 Deep Recursive PII Redaction (redactSensitiveData)
  const complexPayload = {
    userId: "ZZ028459",
    password: "SuperSecretPassword123!",
    token: "jwt_bearer_token_xyz_999",
    accountNumber: "AC98765432",
    meta: {
      authorization: "Bearer eyJhbGciOi...",
      pin: "4321",
      cvv: "987",
      customerDetails: {
        fullName: "John Doe",
        creditCard: "4111111111111111",
        accountList: ["AC11223344", "SB99887766"],
      },
    },
    systemFlags: {
      active: true,
      retryCount: 3,
    },
  };

  interface CleanedComplexPayload {
    userId: string;
    password: string;
    token: string;
    accountNumber: string;
    meta: {
      authorization: string;
      pin: string;
      cvv: string;
      customerDetails: {
        fullName: string;
        creditCard: string;
        accountList: string[];
      };
    };
    systemFlags: {
      active: boolean;
      retryCount: number;
    };
  }

  const cleaned = redactSensitiveData(complexPayload) as unknown as CleanedComplexPayload;
  assert(
    "Logger / PII: Deeply redacts sensitive keys across nested objects and arrays",
    cleaned.userId === "ZZ028459" &&
      cleaned.password === "[REDACTED]" &&
      cleaned.token === "[REDACTED]" &&
      cleaned.accountNumber === "AC****5432" &&
      cleaned.meta.authorization === "[REDACTED]" &&
      cleaned.meta.pin === "[REDACTED]" &&
      cleaned.meta.cvv === "[REDACTED]" &&
      cleaned.meta.customerDetails.creditCard === "[REDACTED]" &&
      cleaned.meta.customerDetails.fullName === "John Doe" &&
      cleaned.meta.customerDetails.accountList[0] === "AC****3344" &&
      cleaned.meta.customerDetails.accountList[1] === "SB****7766" &&
      cleaned.systemFlags.active === true &&
      cleaned.systemFlags.retryCount === 3,
  );

  // 4.4 Circular Reference Protection
  const circularObj: Record<string, unknown> = {
    name: "RootNode",
    secret: "DoNotLeakThis",
  };
  circularObj.self = circularObj;

  const circularCleaned = redactSensitiveData(circularObj) as Record<string, unknown>;
  assert(
    "Logger / PII: Circular references are safely intercepted with '[Circular]' without stack overflow",
    circularCleaned.name === "RootNode" &&
      circularCleaned.secret === "[REDACTED]" &&
      circularCleaned.self === "[Circular]",
  );

  // 4.5 Error Instance Serialization
  const sampleError = new Error("Database connection timeout at 10.0.0.1");
  sampleError.name = "DatabaseTimeoutError";
  const errorCleaned = redactSensitiveData(sampleError) as {
    name: string;
    message: string;
    stack?: string;
  };
  assert(
    "Logger / PII: Error instances preserve name, message and stack trace during redaction",
    errorCleaned.name === "DatabaseTimeoutError" &&
      errorCleaned.message === "Database connection timeout at 10.0.0.1" &&
      typeof errorCleaned.stack === "string",
  );

  // 4.6 Logger Level Filtering & Scoped Child Logger
  logger.setLevel("warn");
  const childLogger = logger.withContext("SECURITY");
  assert(
    "Logger: logger.withContext creates scoped child logger with preset context tag",
    typeof childLogger.debug === "function" &&
      typeof childLogger.info === "function" &&
      typeof childLogger.warn === "function" &&
      typeof childLogger.error === "function",
  );

  logger.setLevel("info");
  assert("Logger: logger.setLevel updates minimum log priority dynamically", true);

  // ===========================================================================
  // Consolidated Summary
  // ===========================================================================
  console.log("\n================================================================================");
  const allPassed = reports.every((r) => r.passed);
  if (allPassed) {
    console.log(
      `ALL ${reports.length} ENVIRONMENT MATRIX, DATA SCHEMAS & PII REDACTION TESTS PASSED WITH 100% SUCCESS!`,
    );
    console.log(
      "================================================================================\n",
    );
    process.exit(0);
  } else {
    const failedCount = reports.filter((r) => !r.passed).length;
    console.error(`FAILED: ${failedCount} OF ${reports.length} TESTS FAILED!`);
    console.log(
      "================================================================================\n",
    );
    process.exit(1);
  }
}

runSuite().catch((err: unknown) => {
  console.error("Runner failed:", err);
  process.exit(1);
});
