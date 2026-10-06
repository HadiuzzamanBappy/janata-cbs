import type { Font } from "../types/primitives";

/**
 * Quill-related constants extracted from the monolith.
 *
 * `QUILL_SIZE_MAP` controls how Quill's named sizes map to numeric pt sizes
 * for both the canvas preview and the PDF renderer. `normal: 13` is the
 * single source of truth that anchors the studio's typography — change with
 * care (see CRITICAL DETAIL #13 in the refactor brief).
 */

export const QUILL_SIZE_MAP: Record<string, number> = {
  small: 10,
  normal: 13,
  large: 18,
  huge: 24,
};

/** Quill font names → studio `Font`. Includes legacy aliases. */
export const QUILL_FONT_MAP: Record<string, Font> = {
  sans: "HELVETICA",
  serif: "TIMES",
  monospace: "COURIER",
  arial: "HELVETICA",
  helvetica: "HELVETICA",
  "times new roman": "TIMES",
  georgia: "TIMES",
  courier: "COURIER",
};

/** Allowed font keys Quill registers. */
export const QUILL_FONT_WHITELIST = ["sans", "serif", "monospace"] as const;

/** Default toolbar layout. Used in `features/text-block/editor/QuillToolbar.tsx`. */
export const QUILL_DEFAULT_TOOLBAR: any[] = [
  [{ header: [1, 2, 3, false] }],
  [{ font: QUILL_FONT_WHITELIST as unknown as string[] }],
  [{ size: ["small", false, "large", "huge"] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "code-block"],
  ["clean"],
];
