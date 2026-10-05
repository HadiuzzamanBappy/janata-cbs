/**
 * Barrel export for all studio types.
 *
 * Consumers should prefer the alias import:
 *   import type { AppState, BodyComponent } from "@types";
 *
 * Avoid `import * as T` — it defeats tree-shaking and obscures call sites.
 */

export * from "./primitives";
export * from "./element";
export * from "./zone";
export * from "./table";
export * from "./text-block";
export * from "./chart";
export * from "./body";
export * from "./report-page";
export * from "./app-state";
