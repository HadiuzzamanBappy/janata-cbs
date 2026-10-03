import { LayoutGrid, Lock, Move, Ruler, Unlock } from "lucide-react";
import type { BodyComponent } from "../../types/body";
import { T } from "../../theme/tokens";
import { PropSection } from "../../components/layout/PropSection";
import { PropGrid2 } from "../../components/layout/PropGrid2";
import { PropCell } from "../../components/layout/PropCell";
import { Toggle } from "../../components/common/Toggle";
import { BodyLayoutSpacingTabs } from "./BodyLayoutSpacingTabs";

/**
 * Shared Layout & Position section used inside every body-component props
 * panel (`ChartPropsPanel`, `ImagePropsPanel`, `TablePropsPanel`,
 * `TextBlockPropsPanel`).
 *
 * Owns:
 *   - Free-position toggle (with stash/restore of original row + slot).
 *   - Width/Height with aspect-lock.
 *   - Column-width flex slider when the component is in a row.
 *   - Margin/Padding tabs (delegated to `BodyLayoutSpacingTabs`).
 */
export function BodyLayoutSection({
  comp,
  onUpdate,
}: {
  comp: BodyComponent;
  onUpdate: (c: BodyComponent) => void;
}) {
  const up = (k: keyof BodyComponent, v: any) => onUpdate({ ...comp, [k]: v });
  const color = "#0891b2";
  const isInRow = !!comp.rowId;
  const mg = comp.margin || { top: 0, bottom: 6, left: 0, right: 0 };
  const pad = comp.padding || { top: 0, bottom: 0, left: 0, right: 0 };

  return (
    <PropSection label="Layout & Position" color={color} icon={<LayoutGrid size={9} />} defaultOpen={true}>
      <Toggle
        label="Free Position"
        icon={<Move size={10} />}
        value={!!comp.freePosition}
        onChange={v => {
          if (v) {
            onUpdate({
              ...comp,
              freePosition: true,
              _origRowId: comp.rowId,
              _origSlotIndex: comp.slotIndex,
              rowId: "" as any,
              flexBasis: undefined,
              freeWidth: comp.freeWidth ?? comp.width ?? 120,
              height: comp.height,
            });
          } else {
            onUpdate({
              ...comp,
              freePosition: false,
              rowId: comp._origRowId ?? comp.rowId,
              slotIndex: comp._origSlotIndex ?? comp.slotIndex,
              _origRowId: undefined,
              _origSlotIndex: undefined,
              width: comp.freeWidth ?? comp.width,
              height: comp.height,
            });
          }
        }}
      />

      {comp.freePosition && (
        <div style={{ background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 6, padding: "6px 8px", marginBottom: 6 }}>
          <div style={{ fontSize: 8, color: "#0891b2", fontWeight: 600, marginBottom: 4 }}>
            Position &amp; Size (mm from body top-left)
          </div>
          <PropGrid2>
            <PropCell label="X (mm)" value={comp.freeX || 0} onChange={v => up("freeX", Math.max(0, +v))} min={0} />
            <PropCell label="Y (mm)" value={comp.freeY || 0} onChange={v => up("freeY", Math.max(0, +v))} min={0} />
          </PropGrid2>
          {comp.type !== "IMAGE" && (
            <PropCell label="Width (mm)" value={comp.freeWidth || 120} onChange={v => up("freeWidth", Math.max(10, +v))} min={10} />
          )}
        </div>
      )}

      <div style={{ marginBottom: 6 }}>
        <div
          style={{
            fontSize: 9, fontWeight: 700, color: T.label, marginBottom: 4,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Ruler size={9} color={color} />
            Size (mm)
          </span>
          <button
            onClick={() => up("aspectLock", !comp.aspectLock)}
            style={{
              display: "flex", alignItems: "center", gap: 3,
              fontSize: 8, padding: "2px 6px",
              borderRadius: 4, cursor: "pointer", fontWeight: 700,
              border: `1px solid ${comp.aspectLock ? color : T.border}`,
              background: comp.aspectLock ? color + "18" : T.bg2,
              color: comp.aspectLock ? color : T.muted,
            }}
          >
            {comp.aspectLock ? <Lock size={8} /> : <Unlock size={8} />}
            {comp.aspectLock ? "Ratio locked" : "Lock ratio"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          <div>
            <div style={{ fontSize: 8, color: T.muted, marginBottom: 1 }}>Width</div>
            <input
              type="number"
              min={10}
              value={comp.freePosition ? comp.freeWidth || 120 : comp.width || ""}
              placeholder="auto"
              onChange={e => {
                const v = +e.target.value;
                if (comp.freePosition) up("freeWidth", Math.max(10, v));
                else up("width", v > 0 ? Math.max(10, v) : undefined);
              }}
              style={{
                width: "100%", padding: "3px 5px",
                fontSize: 10, border: `1px solid ${T.border}`,
                borderRadius: 4, outline: "none",
                fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 8, color: T.muted, marginBottom: 1 }}>Height</div>
            <input
              type="number"
              min={10}
              value={comp.height || ""}
              placeholder="auto"
              onChange={e => {
                const v = +e.target.value;
                up("height", v > 0 ? Math.max(10, v) : undefined);
              }}
              style={{
                width: "100%", padding: "3px 5px",
                fontSize: 10, border: `1px solid ${T.border}`,
                borderRadius: 4, outline: "none",
                fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {isInRow && !comp.freePosition && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: T.label, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
            <LayoutGrid size={9} color="#0891b2" />
            Column Width in Row
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4 }}>
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={comp.flexBasis || 50}
              onChange={e => up("flexBasis", +e.target.value)}
              style={{ flex: 1, accentColor: "#0891b2", height: 4 }}
            />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#0891b2", fontFamily: "monospace", minWidth: 32 }}>
              {comp.flexBasis || 50}%
            </span>
          </div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {(
              [
                ["½", 50],
                ["⅓", 33],
                ["⅔", 67],
                ["¼", 25],
                ["¾", 75],
              ] as const
            ).map(([l, v]) => (
              <button
                key={v}
                onClick={() => up("flexBasis", v)}
                style={{
                  fontSize: 9, padding: "2px 7px",
                  borderRadius: 4, cursor: "pointer", fontWeight: 700,
                  border: `1px solid ${comp.flexBasis === v ? "#0891b2" : T.border}`,
                  background: comp.flexBasis === v ? "#ecfeff" : T.bg2,
                  color: comp.flexBasis === v ? "#0e7490" : T.muted,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      <BodyLayoutSpacingTabs
        mg={mg}
        pad={pad}
        onUpdateMargin={v => up("margin", v)}
        onUpdatePadding={v => up("padding", v)}
        color={color}
      />
    </PropSection>
  );
}
