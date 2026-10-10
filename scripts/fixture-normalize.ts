import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { decodeProtobufValue } from "../src/lib/data-parsers/protobuf-decoder";

const fileArg = process.argv[2] || "branch";
const fileName = fileArg.endsWith(".json") ? fileArg : `${fileArg}.json`;
const baseName = fileName.replace(/\.json$/, "");

const sourcePath = resolve(__dirname, `../fixtures/.response/${fileName}`);
const targetPath = resolve(__dirname, `../fixtures/.response/${baseName}.normalized.json`);

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
