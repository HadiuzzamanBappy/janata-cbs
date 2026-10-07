import { Link } from "lucide-react";
import { useState } from "react";
import { T } from "../../theme/tokens";
import type { Spacing } from "../../types/primitives";

/**
 * Spacing input with three modes — "all equal", "axes (V/H)", "individual".
 *
 * The component owns the mode (`useState`) but not the value — the parent
 * supplies a complete `Spacing` and receives a complete `Spacing` back. The
 * accent colour defaults to amber for margin-like fields, green for
 * padding-like, blue otherwise (inferred from the label string).
 */
export function SpacingInput({
  label,
  value,
  onChange,
  color,
  unit = "pt",
}: {
  label: string;
  value: Spacing;
  onChange: (v: Spacing) => void;
  color?: string;
  unit?: string;
}) {
  const v = value || { top: 0, bottom: 0, left: 0, right: 0 };
  const isMargin = /margin/i.test(label);
  const isPadding = /padding/i.test(label);
  const boxColor = color || (isMargin ? "#d97706" : isPadding ? "#059669" : "#2563eb");
  const shortLbl = label
    .replace(/\s*\(mm\)/i, "")
    .replace(/\s*\(pt\)/i, "")
    .replace(/\s*mm$/i, "")
    .replace(/\s*pt$/i, "")
    .trim();

  const [mode, setMode] = useState<"all" | "axes" | "individual">("individual");
  const [focused, setFocused] = useState<string | null>(null);

  const cycleMode = () =>
    setMode((m) => (m === "individual" ? "all" : m === "all" ? "axes" : "individual"));

  const modeLabel = mode === "all" ? "All equal" : mode === "axes" ? "H / V pairs" : "Individual";
  const modeColor = mode === "individual" ? T.muted : boxColor;

  const setAll = (n: number) => onChange({ top: n, bottom: n, left: n, right: n });
  const setH = (n: number) => onChange({ ...v, left: n, right: n });
  const setV = (n: number) => onChange({ ...v, top: n, bottom: n });

  const field = (lbl: string, val: number, set: (n: number) => void, fkey: string) => {
    const isFoc = focused === fkey;
    return (
      <div
        key={fkey}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
      >
        <span
          style={{
            fontSize: 8,
            color: isFoc ? boxColor : T.muted,
            fontWeight: isFoc ? 700 : 400,
            transition: "color .12s",
            letterSpacing: "0.04em",
          }}
        >
          {lbl}
        </span>
        <input
          type="number"
          value={val ?? 0}
          min={0}
          onFocus={() => setFocused(fkey)}
          onBlur={() => setFocused(null)}
          onChange={(e) => set(+e.target.value)}
          style={{
            width: "100%",
            height: 28,
            textAlign: "center",
            border: `1.5px solid ${isFoc ? boxColor : T.border}`,
            borderRadius: 5,
            fontSize: 11,
            outline: "none",
            background: isFoc ? boxColor + "18" : T.bg2,
            color: T.text,
            fontFamily: "inherit",
            padding: 0,
            transition: "border-color .12s",
          }}
        />
      </div>
    );
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
        <div
          style={{ width: 3, height: 9, borderRadius: 2, background: boxColor, flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: boxColor,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {shortLbl}
        </span>
        <span style={{ fontSize: 8, color: T.muted, marginLeft: 1 }}>{unit}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={cycleMode}
          title={`Mode: ${modeLabel} — click to cycle`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: mode === "individual" ? T.bg2 : boxColor + "15",
            border: `1px solid ${mode === "individual" ? T.border : boxColor + "55"}`,
            color: modeColor,
            borderRadius: 5,
            padding: "2px 7px",
            cursor: "pointer",
            fontSize: 8.5,
            fontWeight: 700,
            transition: "all .15s",
          }}
        >
          <Link size={9} style={{ opacity: mode === "individual" ? 0.4 : 1 }} />
          {modeLabel}
        </button>
      </div>

      {mode === "all" && (
        <div
          style={{
            background: boxColor + "09",
            border: `1px solid ${boxColor}33`,
            borderRadius: 7,
            padding: "7px 10px",
          }}
        >
          <div
            style={{
              fontSize: 8.5,
              color: boxColor,
              fontWeight: 600,
              marginBottom: 5,
              textAlign: "center",
            }}
          >
            All sides equal
          </div>
          {field("↑→↓←", v.top, setAll, "all")}
        </div>
      )}

      {mode === "axes" && (
        <div
          style={{
            background: boxColor + "09",
            border: `1px solid ${boxColor}33`,
            borderRadius: 7,
            padding: "7px 10px",
          }}
        >
          <div
            style={{
              fontSize: 8.5,
              color: boxColor,
              fontWeight: 600,
              marginBottom: 5,
              textAlign: "center",
            }}
          >
            Vertical · Horizontal
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {field("↑↓ V", v.top, setV, "v")}
            {field("←→ H", v.left, setH, "h")}
          </div>
        </div>
      )}

      {mode === "individual" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
          {(
            [
              { side: "top" as const, icon: "↑", title: "T" },
              { side: "right" as const, icon: "→", title: "R" },
              { side: "bottom" as const, icon: "↓", title: "B" },
              { side: "left" as const, icon: "←", title: "L" },
            ] as const
          ).map(({ side, icon, title }) =>
            field(`${icon} ${title}`, v[side] ?? 0, (n) => onChange({ ...v, [side]: n }), side),
          )}
        </div>
      )}
    </div>
  );
}
