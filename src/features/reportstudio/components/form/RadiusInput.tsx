import { useState, type CSSProperties } from "react";
import type { Radius } from "../../types/primitives";
import { T } from "../../theme/tokens";

/**
 * Per-corner radius widget. Renders four inputs absolutely positioned at the
 * corners of a preview rectangle whose corners visualise the current value.
 *
 * `<Field>` is intentionally defined inside the component body — it closes
 * over `r`, `focused`, `ac`, and `onChange`. This matches the monolith and
 * is fine because the component is itself stable.
 */
export function RadiusInput({
  value,
  onChange,
  color,
}: {
  value: Radius;
  onChange: (v: Radius) => void;
  color?: string;
}) {
  const r = value || { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
  const [focused, setFocused] = useState<string | null>(null);
  const ac = color || "#0891b2";

  const Field = ({ k, style }: { k: keyof Radius; style: CSSProperties }) => {
    const isFoc = focused === k;
    return (
      <input
        type="number"
        min={0}
        max={80}
        value={r[k] ?? 0}
        onFocus={() => setFocused(k)}
        onBlur={() => setFocused(null)}
        onChange={e => onChange({ ...r, [k]: +e.target.value })}
        title={k.replace(/([A-Z])/g, " $1").trim()}
        style={{
          width: 32,
          height: 22,
          textAlign: "center",
          border: `1.5px solid ${isFoc ? ac : T.border}`,
          borderRadius: 4,
          fontSize: 10,
          outline: "none",
          background: isFoc ? ac + "18" : T.bg2,
          color: T.text,
          fontFamily: "inherit",
          padding: 0,
          position: "absolute",
          ...style,
          transition: "border-color .12s",
        }}
      />
    );
  };

  const previewRadius = `${r.topLeft || 0}px ${r.topRight || 0}px ${r.bottomRight || 0}px ${r.bottomLeft || 0}px`;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
        <div style={{ width: 3, height: 10, borderRadius: 2, background: ac, flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: ac, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Corner Radius
        </span>
        <span style={{ fontSize: 8, color: T.muted }}>px</span>
        <div style={{ flex: 1, height: 1, background: ac + "18", marginLeft: 4 }} />
      </div>
      <div style={{ position: "relative", width: "100%", height: 86, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 96,
            height: 52,
            border: `2px solid ${ac}55`,
            background: ac + "08",
            borderRadius: previewRadius,
            transition: "border-radius .18s",
          }}
        />
        <Field k="topLeft" style={{ top: 0, left: 0 }} />
        <Field k="topRight" style={{ top: 0, right: 0 }} />
        <Field k="bottomLeft" style={{ bottom: 0, left: 0 }} />
        <Field k="bottomRight" style={{ bottom: 0, right: 0 }} />
      </div>
    </div>
  );
}
