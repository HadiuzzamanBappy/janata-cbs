import type { ReactNode } from "react";
import { T } from "../../theme/tokens";

/**
 * Soft-background card wrapper used to visually group a set of related
 * controls (e.g. an aggregate's `function + color + pageWise + showTotal`
 * cluster). The default `bg="#f8fafc"` matches `T.bg2`; pass another colour
 * for an accent-tinted card.
 */
export function PropCard({ children, bg = "#f8fafc" }: { children: ReactNode; bg?: string }) {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: "9px 10px 6px",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}
