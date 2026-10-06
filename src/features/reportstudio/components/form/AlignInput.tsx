import type { ReactNode } from "react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react";
import { T } from "../../theme/tokens";

/**
 * 4-button align bar. Default option set is `LEFT|CENTER|RIGHT|JUSTIFIED`
 * — pass a shorter set for places that don't support JUSTIFIED (logos,
 * image captions). Accent colour customisable via `color`.
 */
export function AlignInput({
  label = "Align",
  value,
  onChange,
  options = ["LEFT", "CENTER", "RIGHT", "JUSTIFIED"],
  color,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options?: string[];
  color?: string;
}) {
  const icons: Record<string, ReactNode> = {
    LEFT: <AlignLeft size={12} />,
    CENTER: <AlignCenter size={12} />,
    RIGHT: <AlignRight size={12} />,
    JUSTIFIED: <AlignJustify size={12} />,
  };
  const labels: Record<string, string> = {
    LEFT: "Left",
    CENTER: "Center",
    RIGHT: "Right",
    JUSTIFIED: "Justify",
  };
  const ac = color || "#2563eb";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 9.5, color: T.label, minWidth: 80, flexShrink: 0 }}>{label}</span>
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
        {options.map(opt => (
          <button
            key={opt}
            title={labels[opt] || opt}
            onClick={() => onChange(opt)}
            style={{
              width: 26,
              height: 24,
              borderRadius: 4,
              border: "none",
              background: value === opt ? ac : "transparent",
              color: value === opt ? "#fff" : T.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all .12s",
              padding: 0,
            }}
          >
            {icons[opt] || opt[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
