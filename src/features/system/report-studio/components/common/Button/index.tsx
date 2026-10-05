/**
 * Button component capturing the three button styles the monolith uses
 * inline dozens of times: primary (filled accent), ghost (transparent with
 * accent text), and outline (border + accent). Replaces the inline
 * `<button style={{ background: color + "18", ... }}>` patterns scattered
 * across feature panels.
 *
 * Accent colour defaults to the studio blue `#2563eb`; pass `color` to
 * tint a button to match the surrounding feature accent (each props panel
 * picks its own — chart is green, image is pink, etc).
 */

import type { CSSProperties, ReactNode } from "react";
import { T } from "../../../theme/tokens";

export type ButtonVariant = "primary" | "ghost" | "outline" | "danger";

export function Button({
  children,
  onClick,
  variant = "primary",
  color = "#2563eb",
  size = "md",
  disabled,
  title,
  icon,
  style,
  type = "button",
}: {
  children?: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: ButtonVariant;
  color?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  title?: string;
  icon?: ReactNode;
  style?: CSSProperties;
  type?: "button" | "submit" | "reset";
}) {
  const pad =
    size === "sm" ? "3px 8px" : size === "lg" ? "8px 14px" : "5px 11px";
  const fs = size === "sm" ? 9.5 : size === "lg" ? 12 : 10.5;

  const baseStyles: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    border: "none",
    borderRadius: 5,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600,
    fontSize: fs,
    padding: pad,
    transition: "background .12s, border-color .12s, color .12s",
    opacity: disabled ? 0.55 : 1,
    fontFamily: "inherit",
    lineHeight: 1,
  };

  const variantStyles: Record<ButtonVariant, CSSProperties> =
    variant === "primary"
      ? {
          primary: { background: color, color: "#fff" },
          ghost:   {},
          outline: {},
          danger:  {},
        }
      : variant === "ghost"
        ? {
            primary: {},
            ghost: { background: color + "18", color },
            outline: {},
            danger: {},
          }
        : variant === "outline"
          ? {
              primary: {},
              ghost: {},
              outline: {
                background: T.bg,
                color,
                border: `1px solid ${color}55`,
              },
              danger: {},
            }
          : {
              primary: {},
              ghost: {},
              outline: {},
              danger: { background: "#dc2626", color: "#fff" },
            };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{ ...baseStyles, ...variantStyles[variant], ...style }}
    >
      {icon}
      {children}
    </button>
  );
}
