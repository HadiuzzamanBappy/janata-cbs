import type { ReactNode } from "react";

/**
 * Two-column grid wrapper for numeric pairs (X/Y, W/H, etc.). Wraps two
 * `PropCell` children — the cell takes care of its own labelling.
 */
export function PropGrid2({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}
