import type { ReactNode } from "react";
import { T } from "../../theme/tokens";

/**
 * One label + one control in a horizontal row.
 *
 * The label takes a fixed `80px` minimum width so columns of `PropRow`s line
 * up visually — change at your peril, the rest of the right-rail layout
 * banks on this width.
 */
export function PropRow({
  label,
  children,
  mb = 6,
}: {
  label: ReactNode;
  children: ReactNode;
  mb?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: mb,
      }}
    >
      <span
        style={{
          fontSize: 9.5,
          color: T.label,
          minWidth: 80,
          flexShrink: 0,
          lineHeight: 1.3,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
