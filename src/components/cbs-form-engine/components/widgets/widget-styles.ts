/**
 * Shared type scale for every form widget, so values, options and tags read the same everywhere.
 * Change sizes or weights here, never per widget.
 */

/** Values, option labels and choice text: one size and weight, editable or read-only. */
export const WIDGET_TEXT = "text-xs font-normal";

/** The selected option in a radio, select or checkbox group: one step heavier than the value. */
export const WIDGET_TEXT_SELECTED = "font-medium";

/** YES/NO state tags and unit affixes (currency, %). */
export const WIDGET_TAG = "text-2xs font-mono font-medium";

/** Disabled input (text, textarea, amount, rate, date, select): grey fill, grey text, not-allowed cursor. */
export const WIDGET_DISABLED_FIELD =
  "disabled:opacity-100 disabled:bg-muted dark:disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed";

/** Disabled choice (radio, switch, checkbox chips): one fade level and a not-allowed cursor. */
export const WIDGET_DISABLED_CHOICE = "opacity-60 cursor-not-allowed";
