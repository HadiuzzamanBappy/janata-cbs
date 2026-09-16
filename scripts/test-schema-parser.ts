import { parseGMC } from "../src/lib/schema/schema-parser";
import { parseMNU } from "../src/lib/schema/menu-parser";
import { STATIC_SPECS, STATIC_MENU } from "../src/lib/mocks";

console.log("=== Testing Task 3.5 & 3.6 Schema & Menu Parsers ===");

// Task 3.6: Verify real / static GMC parses into typed FormSchema
const validGmcResult = parseGMC(STATIC_SPECS["ACCOUNT"], "ACCOUNT");
if (validGmcResult.success) {
  console.log("✓ Task 3.6 Success: Parsed ACCOUNT schema cleanly.");
  console.log(`  Title: ${validGmcResult.data.title}`);
  console.log(`  Table: ${validGmcResult.data.code}`);
  console.log(`  Fields count: ${validGmcResult.data.fields.length}`);
} else {
  console.error("✗ Task 3.6 Failed:", validGmcResult.error);
  process.exit(1);
}

// Task 3.5: Verify invalid GMC payload produces structured Zod error (not crash)
const invalidGmcResult = parseGMC("INVALID_PAYLOAD_STRING", "ACCOUNT");
if (!invalidGmcResult.success && invalidGmcResult.error.length > 0) {
  console.log("✓ Task 3.5 Success: Invalid GMC payload caught cleanly with structured error:");
  console.log(`  Error: ${invalidGmcResult.error}`);
} else {
  console.error("✗ Task 3.5 Failed: Invalid GMC payload did not fail open cleanly");
  process.exit(1);
}

// Verify MNU parser
const mnuResult = parseMNU(STATIC_MENU);
if (!mnuResult.success) {
  console.error("✗ MNU Parser Failed:", mnuResult.error);
  process.exit(1);
}
console.log("✓ MNU Parser Success: Parsed menu tree with root nodes:", mnuResult.data.length);

console.log("=== All Step 3A Data Dictionary Tests Passed! ===");
