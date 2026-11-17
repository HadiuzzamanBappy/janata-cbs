import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { decodeProtobufValue } from "@/lib/data-parsers/protobuf-decoder";

/**
 * Decodes protobuf `Struct` payloads in a captured raw response into plain JSON.
 *
 * Usage:
 *   pnpm fixture:clean [path]   # path relative to mock/db/.rawResponse (default: grpc/GRL-Branch)
 *   pnpm fixture:clean grpc/GMC
 */
const RAW_RESPONSE_DIR = resolve(__dirname, "../../mock/db/.rawResponse");

const fileArg = process.argv[2] || "grpc/GRL-Branch";
const fileName = fileArg.endsWith(".json") ? fileArg : `${fileArg}.json`;
const baseName = fileName.replace(/\.json$/, "");

const sourcePath = resolve(RAW_RESPONSE_DIR, fileName);
const targetPath = resolve(RAW_RESPONSE_DIR, `${baseName}.normalized.json`);

try {
  const rawText = readFileSync(sourcePath, "utf-8");
  const rawJson = JSON.parse(rawText);

  let normalized: unknown;
  if (Array.isArray(rawJson)) {
    normalized = rawJson.map((item) => ({
      ...item,
      data: decodeProtobufValue(item.data),
    }));
  } else {
    normalized = {
      ...rawJson,
      data: decodeProtobufValue(rawJson.data),
    };
  }

  const outputText = JSON.stringify(normalized, null, 2);
  writeFileSync(targetPath, outputText, "utf-8");

  const originalLines = rawText.split("\n").length;
  const newLines = outputText.split("\n").length;
  const originalBytes = Buffer.byteLength(rawText);
  const newBytes = Buffer.byteLength(outputText);

  console.log(`Original: ${originalLines} lines, ${(originalBytes / 1024).toFixed(1)} KB`);
  console.log(`Normalized: ${newLines} lines, ${(newBytes / 1024).toFixed(1)} KB`);
  console.log(`Saved clean fixture to: ${targetPath}`);
} catch (err) {
  console.error("Failed to normalize fixture:", err);
  process.exit(1);
}
