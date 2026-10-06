import { RotateCw } from "lucide-react";
import { T } from "../../theme/tokens";

/**
 * Rotation slider + preset-degree buttons.
 *
 * Range fixed to `[-180°, +180°]` in 1° increments. Preset buttons are
 * provided by the caller — different element types use different sets
 * (90°/180°/270° for logos, smaller increments for text boxes, …).
 */
export function RotationStrip({
  value,
  onChange,
  presets,
}: {
  value: number;
  onChange: (v: number) => void;
  presets: number[];
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.label, marginBottom: 3 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <RotateCw size={9} />
          Rotation
        </span>
        <span style={{ fontWeight: 700, color: "#7c3aed", fontFamily: "monospace" }}>{value}°</span>
      </div>
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ width: "100%", accentColor: "#7c3aed", height: 4, marginBottom: 4 }}
      />
      <div style={{ display: "flex", gap: 3 }}>
        {presets.map(deg => (
          <button
            key={deg}
            onClick={() => onChange(deg)}
            style={{
              flex: 1,
              background: value === deg ? "#7c3aed" : T.bg2,
              color: value === deg ? "#fff" : T.label,
              border: `1px solid ${value === deg ? "#7c3aed" : T.border}`,
              padding: "3px 0",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 9,
              fontWeight: 600,
              transition: "all .12s",
            }}
          >
            {deg}°
          </button>
        ))}
      </div>
    </div>
  );
}
