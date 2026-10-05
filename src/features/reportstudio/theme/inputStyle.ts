import type { CSSProperties } from "react";
import { T } from "./tokens";

/**
 * Baseline style for the studio's text inputs / selects.
 *
 * Centralised so all `components/form/*` inputs share the same border,
 * radius, padding, and focus colour. To restyle every input in the studio,
 * change this object — do NOT inline overrides at call sites.
 */
export const inputStyle: CSSProperties = {
  background: T.bg,
  border: `1px solid ${T.border}`,
  borderRadius: T.radius,
  color: T.text,
  padding: "4px 8px",
  fontSize: 11,
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
  transition: "border-color .12s",
};
