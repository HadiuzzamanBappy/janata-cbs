/**
 * Colour utilities.
 *
 * All hex strings are expected/produced as `#rrggbb` (lower-case 6-digit) unless
 * a function explicitly documents 8-digit (`#rrggbbaa`) support.
 *
 * These functions are pure and dependency-free — keep them that way so the PDF
 * renderer and the canvas can share them without dragging in React.
 */

/**
 * `true` if the string matches `#rrggbb` (case-insensitive). 8-digit hex is
 * rejected on purpose: the form inputs we expose to users only accept 6-digit.
 */
export function isValidHex(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

/** Convert `#rrggbb` to `[r, g, b]` in `[0, 255]`. Returns `[0,0,0]` on bad input. */
export function hexRgb(hex: string): [number, number, number] {
  const h = (hex || "#000000").replace("#", "");
  if (h.length < 6) return [0, 0, 0];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/**
 * Extract the alpha channel from an 8-digit hex `#rrggbbaa`. Returns 1 for
 * 6-digit hex or invalid input. Used by the PDF renderer to honour separator
 * opacity baked into the colour string.
 */
export function hexAlpha(hex: string): number {
  const h = (hex || "").replace("#", "");
  if (h.length === 8) return parseInt(h.slice(6, 8), 16) / 255;
  return 1;
}

/**
 * Normalise any CSS colour string we might pull off a live DOM node into
 * `#rrggbb`. Handles:
 *   - already-hex (`#abcdef`)               → pass through
 *   - `rgb(r, g, b)` and `rgba(r, g, b, a)` → convert to hex (alpha ignored)
 *   - empty / `transparent` / `rgba(0,0,0,0)` → returns `""`
 *
 * Used by the table-context-menu's "capture current style" path
 * (see `features/text-block/table-context-menu/useCurrentStyle.ts`).
 */
export function toHex(color: string): string {
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") return "";
  if (color.startsWith("#")) return color;
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return "";
  return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
}

/**
 * `#rrggbb` → `[h, s, v]` in degrees / percent / percent.
 *
 * Source: the HSV picker in the monolith. Kept rounded the same way so the
 * picker's UI behaviour (and any baked-in screenshot tests) stay identical.
 */
export function hexToHsv(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [Math.round(h), max ? Math.round((d / max) * 100) : 0, Math.round(max * 100)];
}

/** `[h, s, v]` → `#rrggbb`. Inverse of `hexToHsv`. */
export function hsvToHex(h: number, s: number, v: number): string {
  s /= 100;
  v /= 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const toH = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toH(f(5))}${toH(f(3))}${toH(f(1))}`;
}
