/**
 * @fileoverview Scans all TypeScript/TSX files under src/ for deprecated symbol usages
 * (TypeScript diagnostics TS6385 / TS6387 — the same strikethrough warnings shown in VS Code).
 *
 * Run via: pnpm deprecated
 */

import path from "node:path";
import ts from "typescript";

const cfgPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json");
if (!cfgPath) {
  console.error("Could not find tsconfig.json");
  process.exit(1);
}

const cfg = ts.readConfigFile(cfgPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, path.dirname(cfgPath));

const files = parsed.fileNames.filter((f) => {
  const norm = f.replace(/\\/g, "/");
  return (
    norm.includes("/src/") &&
    !norm.includes("/src/components/ui/") &&
    !norm.includes("infra-grpc/generated")
  );
});

const host: ts.LanguageServiceHost = {
  getScriptFileNames: () => files,
  getScriptVersion: () => "1",
  getScriptSnapshot: (f) =>
    ts.sys.fileExists(f) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f) ?? "") : undefined,
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => parsed.options,
  getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
};

const ls = ts.createLanguageService(host, ts.createDocumentRegistry());
const program = ls.getProgram();
let count = 0;

for (const f of files) {
  for (const d of ls.getSuggestionDiagnostics(f)) {
    if ((d.code === 6385 || d.code === 6387) && d.start !== undefined) {
      count++;
      const sf = program?.getSourceFile(f);
      const pos = sf?.getLineAndCharacterOfPosition(d.start);
      const loc = pos ? `${pos.line + 1}:${pos.character + 1}` : "?";
      const msg = ts.flattenDiagnosticMessageText(d.messageText, " ");
      console.log(`${path.relative(process.cwd(), f)}:${loc} [TS${d.code}] ${msg}`);
    }
  }
}

if (count > 0) {
  console.error(`\nFound ${count} deprecated symbol usage(s).`);
  process.exit(1);
}

console.log(`Checked ${files.length} files: 0 deprecated symbol usages found.`);
