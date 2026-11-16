/**
 * Automated Verification Suite for Architectural Layer Boundaries (src/**)
 *
 * Static import-graph audit enforcing the invariants in `.agents/rules/01-architecture-layers.md`:
 * 1. Unidirectional Layers (a lower layer never imports a higher layer)
 * 2. Feature/Component Barrels (outside consumers import a unit's `index.ts`, or its
 *    server-only entry `<unit>/server.ts` for filesystem/backend-bound exports)
 * 3. Client Boundary ("use client" files never import server-only drivers/modules)
 * 4. Server Sealing (every `lib/infra-grpc` & `lib/infra-redis` module starts with "server-only")
 *
 * Strict: any finding fails the suite. There is no allowlist, so fix the import instead.
 *
 * Usage:
 *   pnpm verify:layers
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const EXCLUDED = ["components/ui/", "lib/infra-grpc/generated/"] as const;

/** Layer ranks (lower = more foundational). Prefixes are src-relative posix paths. */
const LAYERS: ReadonlyArray<readonly [prefix: string, rank: number, label: string]> = [
  ["types", 0, "L0 types"],
  ["lib/data-schemas", 0, "L0 data-schemas"],
  ["lib/core-config", 1, "L1 core-config"],
  ["lib/core-logger", 1, "L1 core-logger"],
  ["lib/data-parsers", 1, "L1 data-parsers"],
  ["lib/infra-", 1, "L1 infra"],
  ["lib/core-utils", 2, "L2 core-utils"],
  ["lib/cbs-", 2, "L2 cbs-lib"],
  ["store", 3, "L3 store"],
  ["hooks", 3.5, "L3.5 hooks"],
  ["components", 4, "L4 components"],
  ["features", 5, "L5 features"],
  ["app", 6, "L6 app"],
  ["proxy.ts", 6, "L6 proxy"],
];

const SERVER_SPECIFIERS = [
  /^@\/lib\/infra-(grpc|redis)/,
  /^@\/lib\/core-config\/server/,
  /^@grpc\//,
  /^ioredis$/,
];
const SEALED_DIRS = ["lib/infra-grpc/", "lib/infra-redis/"] as const;
const STATIC_ASSET_RE = /\.(png|jpe?g|gif|webp|svg|ico|avif)$/;

function toPosix(p: string): string {
  return p.split("\\").join("/");
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function layerOf(srcPath: string): readonly [string, number, string] | undefined {
  return LAYERS.find(([prefix]) => srcPath === prefix || srcPath.startsWith(prefix));
}

/** Barrel units: `components/<x>` and `features/<x>`, or `features/<group>/<x>` when the group has no index. */
function collectUnits(): string[] {
  const hasIndex = (d: string) =>
    ["index.ts", "index.tsx"].some((f) => existsSync(join(SRC, d, f)));
  const subdirs = (d: string) =>
    readdirSync(join(SRC, d)).filter((n) => statSync(join(SRC, d, n)).isDirectory());
  const units: string[] = [];
  for (const name of subdirs("components")) {
    if (name !== "ui" && hasIndex(`components/${name}`)) units.push(`components/${name}`);
  }
  for (const name of subdirs("features")) {
    const unit = `features/${name}`;
    if (hasIndex(unit)) units.push(unit);
    else
      for (const sub of subdirs(unit)) if (hasIndex(`${unit}/${sub}`)) units.push(`${unit}/${sub}`);
  }
  return units;
}

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function extractSpecifiers(code: string): string[] {
  const specs: string[] = [];
  const patterns = [
    /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /^\s*import\s*['"]([^'"]+)['"]/gm,
  ];
  for (const re of patterns) for (const m of code.matchAll(re)) specs.push(m[1]);
  return specs;
}

/** Resolves an import specifier to a src-relative posix path, or undefined for externals. */
function resolveTarget(spec: string, fromFile: string): string | undefined {
  if (spec.startsWith("@/")) return spec.slice(2);
  if (spec.startsWith(".")) return toPosix(relative(SRC, resolve(dirname(fromFile), spec)));
  return undefined;
}

function audit(): string[] {
  const units = collectUnits();
  const unitOf = (p: string) => units.find((u) => p === u || p.startsWith(`${u}/`));
  const found = new Set<string>();

  for (const file of walk(SRC)) {
    const src = toPosix(relative(SRC, file));
    if (EXCLUDED.some((e) => src.startsWith(e))) continue;
    const raw = readFileSync(file, "utf-8");
    const code = stripComments(raw);
    const fromLayer = layerOf(src);
    const isClient = /^\s*['"]use client['"]/.test(raw);

    if (SEALED_DIRS.some((d) => src.startsWith(d)) && !/import\s+['"]server-only['"]/.test(code)) {
      found.add(`server-sealing: ${src}`);
    }

    for (const spec of extractSpecifiers(code)) {
      if (isClient && SERVER_SPECIFIERS.some((re) => re.test(spec))) {
        found.add(`client-boundary: ${src} -> ${spec}`);
      }
      const target = resolveTarget(spec, file);
      // Static assets (e.g. Next metadata files like `@/app/icon.png`) are bundler-hashed file
      // references, not code dependencies: they cannot form cycles or leak server code.
      if (!target || STATIC_ASSET_RE.test(target)) continue;

      const toLayer = layerOf(target);
      if (fromLayer && toLayer && toLayer[1] > fromLayer[1]) {
        found.add(`layer-inversion: ${src} (${fromLayer[2]}) -> ${spec} (${toLayer[2]})`);
      }

      const targetUnit = unitOf(target);
      const isPublicEntry = target === targetUnit || target === `${targetUnit}/server`;
      if (targetUnit && targetUnit !== unitOf(src) && !isPublicEntry) {
        found.add(`barrel-bypass: ${src} -> ${spec} (use @/${targetUnit})`);
      }
    }
  }
  return [...found].sort();
}

function runSuite() {
  console.log("\n================================================================================");
  console.log("             CBS ARCHITECTURAL LAYER BOUNDARY VERIFICATION                      ");
  console.log("================================================================================");

  const findings = audit();
  console.log(`\n  Files audited under: ${posix.join("src", "**")}`);
  for (const v of findings) console.error(`\x1b[31m✖ [FAIL]\x1b[0m ${v}`);

  console.log("\n================================================================================");
  if (findings.length === 0) {
    console.log(">>> SUCCESS: NO LAYER, BARREL OR SERVER-BOUNDARY VIOLATIONS! <<<");
  } else {
    console.error(`>>> FAILURE: ${findings.length} BOUNDARY VIOLATION(S)! <<<`);
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runSuite();
