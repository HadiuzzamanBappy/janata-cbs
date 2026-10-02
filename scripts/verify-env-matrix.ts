/**
 * Environment Matrix Verification Script
 * Validates the 4 configuration matrix permutations:
 *  1. Pure Offline:   MODEL_SOURCE=static, CACHE_ENABLED=false
 *  2. Cached Offline: MODEL_SOURCE=static, CACHE_ENABLED=true
 *  3. Live gRPC:      MODEL_SOURCE=grpc,   CACHE_ENABLED=false
 *  4. Production:     MODEL_SOURCE=grpc,   CACHE_ENABLED=true
 */

import { envSchema } from "../src/lib/config/env";
import { STATIC_MODELS, STATIC_MENU, STATIC_COMMANDS, STATIC_BRANCHES, STATIC_USERS } from "../fixtures";
import { parseGMC } from "../src/features/screens/forms/utils/schema-parser";
import { parseMNU } from "../src/features/screens/utils/menu-parser";

console.log("==================================================");
console.log(" FinX-UI Environment & Fixtures Verification Test ");
console.log("==================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
  }
}

// --- 1. Fixture Integrity Tests ---
console.log("1. Validating Aligned Wire Fixtures:");
assert(Object.keys(STATIC_USERS).length >= 2, "STATIC_USERS contains valid user records");
assert(Boolean(STATIC_MENU?.fields?.records?.list_value?.values?.length), "STATIC_MENU has protobuf wire format");
assert(Boolean(STATIC_COMMANDS?.data?.fields?.records?.list_value?.values?.length), "STATIC_COMMANDS has protobuf wire format");
assert(Array.isArray(STATIC_BRANCHES) && STATIC_BRANCHES.length > 0, "STATIC_BRANCHES contains branch records");

const menuParsed = parseMNU(STATIC_MENU);
assert(menuParsed.success && menuParsed.data.length > 0, "parseMNU successfully parses STATIC_MENU wire payload");

// Test form and enquiry specs in STATIC_MODELS
const formAccount = parseGMC(STATIC_MODELS["ACCOUNT"], "ACCOUNT");
assert(formAccount.success && formAccount.data.idPrefix === "AC", "ACCOUNT parsed as Form schema (idPrefix='AC')");

const enqUserList = parseGMC(STATIC_MODELS["USER.LIST"], "USER.LIST");
assert(enqUserList.success && Array.isArray(enqUserList.data.columns) && enqUserList.data.columns.length > 0, "USER.LIST parsed with Enquiry columns");

const enqEmpInfo = parseGMC(STATIC_MODELS["GET.EMP.INFO"], "GET.EMP.INFO");
assert(enqEmpInfo.success && Array.isArray(enqEmpInfo.data.columns) && enqEmpInfo.data.columns.length > 0, "GET.EMP.INFO parsed with Enquiry columns");

// --- 2. Permutation 1: Pure Offline (MODEL_SOURCE=static, CACHE_ENABLED=false) ---
console.log("\n2. Testing Permutation 1: Pure Offline (static + cache: false):");
const p1 = envSchema.safeParse({
  MODEL_SOURCE: "static",
  USER_SOURCE: "static",
  CACHE_ENABLED: "false",
});
assert(p1.success, "Validates without requiring gRPC or Redis credentials");

// --- 3. Permutation 2: Cached Offline (MODEL_SOURCE=static, CACHE_ENABLED=true) ---
console.log("\n3. Testing Permutation 2: Cached Offline (static + cache: true):");
const p2Fail = envSchema.safeParse({
  MODEL_SOURCE: "static",
  USER_SOURCE: "static",
  CACHE_ENABLED: "true",
  REDIS_URL: "",
});
assert(!p2Fail.success, "Rejects CACHE_ENABLED=true if REDIS_URL is empty");

const p2Pass = envSchema.safeParse({
  MODEL_SOURCE: "static",
  USER_SOURCE: "static",
  CACHE_ENABLED: "true",
  REDIS_URL: "redis://127.0.0.1:6379",
});
assert(p2Pass.success, "Accepts CACHE_ENABLED=true when REDIS_URL is provided");

// --- 4. Permutation 3: Direct gRPC (MODEL_SOURCE=grpc, CACHE_ENABLED=false) ---
console.log("\n4. Testing Permutation 3: Direct gRPC (grpc + cache: false):");
const p3Fail = envSchema.safeParse({
  MODEL_SOURCE: "grpc",
  USER_SOURCE: "grpc",
  CACHE_ENABLED: "false",
  GRPC_HOST: "",
});
assert(!p3Fail.success, "Rejects MODEL_SOURCE=grpc if GRPC_HOST is empty");

const p3Pass = envSchema.safeParse({
  MODEL_SOURCE: "grpc",
  USER_SOURCE: "grpc",
  CACHE_ENABLED: "false",
  GRPC_HOST: "127.0.0.1:9090",
  CLIENT_ID: "CBS_CLIENT",
});
assert(p3Pass.success, "Accepts MODEL_SOURCE=grpc when gRPC credentials provided");

// --- 5. Permutation 4: Full Production (MODEL_SOURCE=grpc, CACHE_ENABLED=true) ---
console.log("\n5. Testing Permutation 4: Full Production (grpc + cache: true):");
const p4Pass = envSchema.safeParse({
  MODEL_SOURCE: "grpc",
  USER_SOURCE: "grpc",
  CACHE_ENABLED: "true",
  GRPC_HOST: "127.0.0.1:9090",
  CLIENT_ID: "CBS_CLIENT",
  REDIS_URL: "redis://127.0.0.1:6379",
});
assert(p4Pass.success, "Accepts production configuration with both gRPC and Redis");

console.log("\n==================================================");
console.log(` Summary: ${passedCount}/${totalCount} tests passed`);
console.log("==================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
