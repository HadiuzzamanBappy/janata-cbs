/**
 * @fileoverview Unified CBS Form Specification & Runtime Engine
 * @module cbs-form-spec
 *
 * Provides headless form compilation, canonical layout generation,
 * reactive field behaviors, validation, and layout grid calculations:
 *
 * 1. compile: Master specification compiler & fallback generator
 * 2. field-normalizer: Canonical field property mapping & width tokens
 * 3. field-rules: Reactive transforms, cascades, conditions, and on-change
 * 4. validation: Headless validation engine with nested recursive checking
 * 5. layout-blocks: Tab clustering and container layout grouping
 * 6. layout-grid: 1 to 4 column section grids, cell spans & input width caps
 * 7. path-utils: Pure, immutable flat & dot-notated record accessors
 * 8. lookup-options: Lookup model rows mapped to select options (PARAMETER M / A)
 */

export * from "./compile";
export * from "./field-normalizer";
export * from "./field-rules";
export * from "./layout-blocks";
export * from "./layout-grid";
export * from "./lookup-options";
export * from "./path-utils";
export * from "./record-dates";
export * from "./validation";
