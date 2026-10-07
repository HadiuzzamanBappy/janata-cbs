/**
 * Barrel export for all studio types.
 *
 * Consumers should prefer the alias import:
 *   import type { AppState, BodyComponent } from "@types";
 *
 * Avoid `import * as T` — it defeats tree-shaking and obscures call sites.
 */

export * from "./app-state";
export * from "./body";
export * from "./chart";
export * from "./element";
export * from "./primitives";
export * from "./report-page";
export * from "./table";
export * from "./text-block";
export * from "./zone";
