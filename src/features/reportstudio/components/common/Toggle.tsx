import type { ReactNode } from "react";
import { T } from "../../theme/tokens";

/**
 * Pill toggle with optional inline icon — extracted from the monolith's
 * `PropToggle`. The whole row is clickable, not just the slider.
 *
 * The "on" state lights up the pill blue and tints the label/background.
 * Off-state stays neutral. Smooth slider transition is `0.18s` everywhere
 * to match the rest of the studio's micro-animations.
 */
export function Toggle({
  label,
  value,
  onChange,
  icon,
}: {
  label: ReactNode;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
        cursor: "pointer",
        padding: "5px 8px",
        borderRadius: 6,
        background: value ? "#eff6ff" : T.bg2,
        border: `1px solid ${value ? "#bfdbfe" : T.border}`,
        transition: "all .15s",
      }}
      onClick={() => onChange(!value)}
    >
      <span
        style={{
          fontSize: 10,
          color: value ? "#1d4ed8" : T.label,
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontWeight: value ? 600 : 400,
        }}
      >
        {icon}
        {label}
      </span>
      <div
        style={{
          width: 30,
          height: 17,
          borderRadius: 9,
          background: value ? "#2563eb" : "#cbd5e1",
          position: "relative",
          flexShrink: 0,
          transition: "background .18s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: value ? 14 : 2,
            width: 13,
            height: 13,
            borderRadius: "50%",
            background: "#fff",
            transition: "left .18s",
            boxShadow: "0 1px 3px rgba(0,0,0,.2)",
          }}
        />
      </div>
    </div>
  );
}
