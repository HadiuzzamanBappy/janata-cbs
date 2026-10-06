import { LayoutGrid, Maximize2, Palette, Trash2 } from "lucide-react";
import type { ZoneRow } from "../../types/zone";
import { T } from "../../theme/tokens";
import { PropSection } from "../../components/layout/PropSection";
import { PropRow } from "../../components/layout/PropRow";
import { PropCell } from "../../components/layout/PropCell";
import { ColorInput } from "../../components/form/ColorInput";
import { BodyRowSpacingTabs } from "../body/BodyRowSpacingTabs";

/**
 * Properties panel for a `ZoneRow` inside the header/footer.
 *
 * Mirrors `BodyRowPropsPanel` but for zones — column-count picker, height,
 * background, spacing tabs. Accent colour is blue for header rows, purple
 * for footer rows.
 */
export function ZoneRowPropsPanel({
  row,
  zone,
  onUpdate,
  onDelete,
}: {
  row: ZoneRow;
  zone: "header" | "footer";
  onUpdate: (r: ZoneRow) => void;
  onDelete: () => void;
}) {
  const up = (k: string, v: any) => onUpdate({ ...row, [k]: v });
  const color = zone === "header" ? "#2563eb" : "#7c3aed";
  const mg = row.margin || { top: 0, bottom: 0, left: 0, right: 0 };
  const pad = row.padding || { top: 0, bottom: 0, left: 0, right: 0 };

  return (
    <div style={{ fontSize: 11 }}>
      <div
        style={{
          background: `${color}08`, border: `1px solid ${color}22`,
          borderRadius: 10, padding: "10px 12px", marginBottom: 10,
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <div
          style={{
            width: 28, height: 28, borderRadius: 7,
            background: `${color}18`, border: `1.5px solid ${color}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color, flexShrink: 0,
          }}
        >
          <LayoutGrid size={14} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Row Properties</div>
          <div style={{ fontSize: 8.5, color: `${color}99`, marginTop: 1 }}>
            {row.cols} column{row.cols > 1 ? "s" : ""}
          </div>
        </div>
        <button
          onClick={onDelete}
          style={{
            width: 25, height: 25, borderRadius: 5, cursor: "pointer",
            background: "#fee2e2", borderColor: "#fca5a5", color: "#dc2626",
            border: "1px solid",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Trash2 size={11} />
        </button>
      </div>

      <PropSection label="Layout" color={color} icon={<LayoutGrid size={9} />}>
        <PropRow label="Columns">
          <div style={{ display: "flex", gap: 4 }}>
            {([1, 2, 3, 4] as const).map(cols => (
              <button
                key={cols}
                onClick={() => up("cols", cols)}
                style={{
                  flex: 1, padding: "10px 4px",
                  background: row.cols === cols ? color : T.bg2,
                  color: row.cols === cols ? "#fff" : T.muted,
                  border: `1px solid ${row.cols === cols ? color : T.border}`,
                  borderRadius: 6, cursor: "pointer",
                  fontSize: 10, fontWeight: 700, transition: "all 0.15s",
                }}
              >
                {cols}
              </button>
            ))}
          </div>
        </PropRow>
        <PropCell label="Height (mm)" value={row.height || 40} onChange={v => up("height", v)} min={1} max={200} />
      </PropSection>

      <PropSection label="Style" color="#d97706" icon={<Palette size={9} />} defaultOpen={false}>
        <ColorInput label="Background" value={row.background || "transparent"} onChange={v => up("background", v)} />
      </PropSection>

      <PropSection label="Spacing" color="#64748b" icon={<Maximize2 size={9} />} defaultOpen={false}>
        <BodyRowSpacingTabs
          mg={mg}
          pad={pad}
          onUpdateMargin={v => up("margin", v)}
          onUpdatePadding={v => up("padding", v)}
          color={color}
        />
      </PropSection>
    </div>
  );
}
