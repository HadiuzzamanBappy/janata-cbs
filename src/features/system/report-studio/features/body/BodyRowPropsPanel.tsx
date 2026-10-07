import { Columns3, EyeOff, Frame, LayoutGrid, Lock, Palette, Trash2 } from "lucide-react";
import { useState } from "react";
import { Toggle } from "../../components/common/Toggle";
import { ColorInput } from "../../components/form/ColorInput";
import { PropCell } from "../../components/layout/PropCell";
import { PropSection } from "../../components/layout/PropSection";
import { T } from "../../theme/tokens";
import type { BodyRow } from "../../types/body";
import { BodyRowSpacingTabs } from "./BodyRowSpacingTabs";

/**
 * Properties panel for a `BodyRow`. Renders identity card (label/hide/lock/
 * delete), column-count picker, background colour, and margin/padding tabs.
 *
 * Accordion-style sections — only one open at a time via local `openSection`
 * state. Matches the monolith's v5.3 behaviour.
 */
export function BodyRowPropsPanel({
  row,
  compsCount,
  onUpdate,
  onDelete,
}: {
  row: BodyRow;
  compsCount: number;
  onUpdate: (r: BodyRow) => void;
  onDelete: () => void;
}) {
  const up = (k: keyof BodyRow, v: any) => onUpdate({ ...row, [k]: v });
  const color = "#059669";
  const mg = row.margin || { top: 0, bottom: 8, left: 0, right: 0 };
  const pad = row.padding || { top: 4, bottom: 4, left: 0, right: 0 };

  const [openSection, setOpenSection] = useState<string>("columns");

  return (
    <div style={{ fontSize: 11 }}>
      <div
        style={{
          background: `${color}09`,
          border: `1px solid ${color}22`,
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: `${color}18`,
              border: `1.5px solid ${color}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color,
              flexShrink: 0,
            }}
          >
            <LayoutGrid size={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={row.label}
              onChange={(e) => up("label", e.target.value)}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "2px 6px",
                color: T.text,
                background: "transparent",
                border: "none",
                width: "100%",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <div style={{ fontSize: 8.5, color: `${color}99`, marginTop: 1 }}>
              {row.cols} column{row.cols > 1 ? "s" : ""} · {compsCount} component
              {compsCount !== 1 ? "s" : ""}
            </div>
          </div>
          <button
            onClick={onDelete}
            title="Delete row"
            style={{
              width: 25,
              height: 25,
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#dc2626",
              borderRadius: 5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Toggle
            label="Hidden"
            icon={<EyeOff size={10} />}
            value={!!row.hidden}
            onChange={(v) => up("hidden", v)}
          />
          <Toggle
            label="Locked"
            icon={<Lock size={10} />}
            value={!!row.locked}
            onChange={(v) => up("locked", v)}
          />
        </div>
      </div>

      <PropSection
        label="Columns"
        color={color}
        icon={<Columns3 size={9} />}
        isOpen={openSection === "columns"}
        onToggle={() => setOpenSection(openSection === "columns" ? "" : "columns")}
      >
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: T.muted, marginBottom: 4 }}>
            Number of column slots:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => up("cols", n)}
                style={{
                  padding: "8px 4px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 12,
                  border: `2px solid ${row.cols === n ? color : T.border}`,
                  background: row.cols === n ? color + "14" : T.bg,
                  color: row.cols === n ? color : T.muted,
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 3, marginTop: 6, height: 20 }}>
            {Array.from({ length: row.cols }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: color + "20",
                  border: `1px solid ${color}44`,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 7,
                  color,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <PropCell
          label="Column gap (mm)"
          value={row.gap ?? 8}
          onChange={(v) => up("gap", Math.max(0, +v))}
          min={0}
        />
      </PropSection>

      <PropSection
        label="Appearance"
        color={color}
        icon={<Palette size={9} />}
        isOpen={openSection === "appearance"}
        onToggle={() => setOpenSection(openSection === "appearance" ? "" : "appearance")}
      >
        <ColorInput
          label="Background"
          value={row.background || "transparent"}
          onChange={(v) => up("background", v)}
        />
      </PropSection>

      <PropSection
        label="Spacing"
        color={color}
        icon={<Frame size={9} />}
        isOpen={openSection === "spacing"}
        onToggle={() => setOpenSection(openSection === "spacing" ? "" : "spacing")}
      >
        <BodyRowSpacingTabs
          mg={mg}
          pad={pad}
          onUpdateMargin={(v) => up("margin", v)}
          onUpdatePadding={(v) => up("padding", v)}
          color={color}
        />
      </PropSection>
    </div>
  );
}
