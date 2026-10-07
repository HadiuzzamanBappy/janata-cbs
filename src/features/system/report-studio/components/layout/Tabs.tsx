import type { ReactNode } from "react";
import { T } from "../../theme/tokens";

/**
 * Lightweight pill-tab component used by `BodyRowSpacingTabs`,
 * `BodyLayoutSpacingTabs`, and similar two/three-way switches.
 *
 * Stateless — owner picks `active` and re-renders on `onChange`. Keep it that
 * way; the page-setup and body-row panels both rely on parent-owned state to
 * keep their save/undo behaviour consistent.
 */
export interface TabSpec<V extends string = string> {
  value: V;
  label: ReactNode;
  /** Optional per-tab accent. Defaults to the inherited tab colour. */
  color?: string;
}

export function Tabs<V extends string>({
  tabs,
  active,
  onChange,
  color = "#2563eb",
}: {
  tabs: TabSpec<V>[];
  active: V;
  onChange: (v: V) => void;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        background: T.bg2,
        borderRadius: 6,
        padding: 2,
        border: `1px solid ${T.border}`,
      }}
    >
      {tabs.map((t) => {
        const isActive = active === t.value;
        const ac = t.color || color;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            style={{
              flex: 1,
              padding: "4px 10px",
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              borderRadius: 4,
              border: "none",
              background: isActive ? ac : "transparent",
              color: isActive ? "#fff" : T.muted,
              cursor: "pointer",
              transition: "all .12s",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
