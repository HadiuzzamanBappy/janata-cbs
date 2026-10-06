import type { CSSProperties } from "react";

/**
 * Studio design tokens.
 *
 * The monolith inlined a `T = { bg, bg2, ... }` object literal at module
 * level and referenced it from every props panel. Re-exported here under the
 * same name (`T`) so a feature can simply `import { T } from "@theme/tokens"`
 * without re-typing the field set.
 */
export const T = {
  bg: "var(--card)",
  bg2: "var(--muted)",
  bg3: "var(--background)",
  border: "var(--border)",
  border2: "var(--input)",
  label: "var(--muted-foreground)",
  text: "var(--foreground)",
  muted: "var(--muted-foreground)",
  radius: 6,
} as const;

/** Stable readonly type of the token object — handy for prop typings. */
export type ThemeTokens = typeof T;

/**
 * Shared CSS `<input>` style — re-exported from `theme/inputStyle.ts` for
 * back-compat with files that imported it from the same module as `T` in the
 * monolith. New code should import from `theme/inputStyle.ts` directly.
 */
export type { CSSProperties as ReactCSS } from "react";

/** Convenience: type-safe lookup. */
export const token = <K extends keyof ThemeTokens>(k: K): ThemeTokens[K] => T[k];

// Re-export marker so tree-shaking doesn't drop this file when only `T` is used.
export const __TOKENS_VERSION = 1;
export type __TokenStyle = CSSProperties;
