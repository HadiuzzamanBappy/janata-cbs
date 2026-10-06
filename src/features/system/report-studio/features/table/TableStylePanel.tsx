import { GripVertical, Maximize2, Palette, Table2 } from "lucide-react";
import type { TableStyle } from "../../types/table";
import { T } from "../../theme/tokens";
import { PropSection } from "../../components/layout/PropSection";
import { PropGrid2 } from "../../components/layout/PropGrid2";
import { PropCell } from "../../components/layout/PropCell";
import { Select } from "../../components/form/Select";
import { ColorInput } from "../../components/form/ColorInput";
import { SpacingInput } from "../../components/form/SpacingInput";
import { Toggle } from "../../components/common/Toggle";

/**
 * Style panel for a standalone TABLE body component.
 *
 * Edits the `TableStyle` shape (the standalone-TABLE one — NOT the
 * Quill-table-blot style; see migration notes). `odd` is the per-table
 * alternating-row background colour stored on `comp.tableOddRowBg`.
 */
export function TableStylePanel({
  ts: tableStyleData,
  odd,
  onTs,
  onOdd,
}: {
  ts: TableStyle;
  odd: string;
  onTs: (t: TableStyle) => void;
  onOdd: (v: string) => void;
}) {
  const up = (k: string, v: any) => onTs({ ...tableStyleData, [k]: v });
  return (
    <div style={{ fontSize: 11 }}>
      <div
        style={{
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 10, padding: "10px 12px",
          marginBottom: 10,
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <div
          style={{
            width: 28, height: 28, borderRadius: 7,
            background: "#d97706" + "18", border: "1.5px solid #d97706" + "44",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#d97706", flexShrink: 0,
          }}
        >
          <Table2 size={13} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Table Style</div>
          <div style={{ fontSize: 8.5, color: "#d97706" + "99", marginTop: 1 }}>
            Global table appearance
          </div>
        </div>
      </div>

      <PropSection label="Colors" color="#d97706" icon={<Palette size={9} />}>
        <ColorInput label="Header" value={tableStyleData.headerColor} onChange={v => up("headerColor", v)} />
        <ColorInput label="Border" value={tableStyleData.borderColor} onChange={v => up("borderColor", v)} />
        <ColorInput label="Odd Row" value={odd} onChange={onOdd} />
      </PropSection>

      <PropSection label="Borders" color="#64748b" icon={<GripVertical size={9} />}>
        <PropGrid2>
          <PropCell label="Width" value={tableStyleData.borderWidth} onChange={v => up("borderWidth", v)} step={0.1} min={0} />
          <div>
            <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Style</div>
            <Select value={tableStyleData.borderStyle} onChange={v => up("borderStyle", v)} options={["solid", "dashed", "dotted"]} />
          </div>
        </PropGrid2>
        <Toggle label="Horizontal Only" value={tableStyleData.horizontalBorderOnly} onChange={v => up("horizontalBorderOnly", v)} />
        <Toggle label="Data Border" value={tableStyleData.dataBorder} onChange={v => up("dataBorder", v)} />
        <Toggle label="Header Border" value={tableStyleData.headerBorder} onChange={v => up("headerBorder", v)} />
      </PropSection>

      <PropSection label="Cell Padding" color="#059669" icon={<Maximize2 size={9} />} defaultOpen={false}>
        <SpacingInput label="Cell Padding" value={tableStyleData.cellPadding} onChange={v => up("cellPadding", v)} />
      </PropSection>
    </div>
  );
}
