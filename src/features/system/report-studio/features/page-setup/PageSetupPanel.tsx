import { Database, Frame, LayoutTemplate, Maximize2 } from "lucide-react";
import { useState } from "react";
import { Toggle } from "../../components/common/Toggle";
import { Select } from "../../components/form/Select";
import { SpacingInput } from "../../components/form/SpacingInput";
import { PropCell } from "../../components/layout/PropCell";
import { PropGrid2 } from "../../components/layout/PropGrid2";
import { PropSection } from "../../components/layout/PropSection";
import { PAGE_SIZE_MM } from "../../constants/pages";
import { T } from "../../theme/tokens";
import type { AppState } from "../../types/app-state";
import { getPageWidthMm } from "../../utils/units";

/**
 * Right-rail panel that controls page-level settings: paper size,
 * orientation, margins, and PDF output knobs.
 *
 * `onUpdate(path, value)` uses dot-notation paths into `AppState`. The
 * matching dispatcher lives on the reducer (Phase 7). Until then the
 * placeholder studio passes a no-op.
 */
export function PageSetupPanel({
  reportState,
  onUpdate,
}: {
  reportState: AppState;
  onUpdate: (path: string, v: any) => void;
}) {
  const up = (path: string, v: any) => onUpdate(path, v);
  const isLand = reportState.page.orientation === "landscape";
  const pgW = getPageWidthMm(reportState.page.size, reportState.page.orientation);
  const pgH = (() => {
    const [w, h] = PAGE_SIZE_MM[reportState.page.size] || [210, 297];
    return isLand ? w : h;
  })();

  const [openSection, setOpenSection] = useState<string>("paper");

  return (
    <div style={{ fontSize: 11 }}>
      <div
        style={{
          background: T.bg2,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          padding: "12px",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "#64748b18",
              border: "1.5px solid #64748b44",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              flexShrink: 0,
            }}
          >
            <LayoutTemplate size={13} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Page Setup</div>
            <div style={{ fontSize: 8.5, color: T.muted, marginTop: 1 }}>
              {pgW}×{pgH}mm · {reportState.page.orientation}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: isLand ? 56 : 40,
              height: isLand ? 40 : 56,
              background: "#fff",
              border: "1.5px solid #94a3b8",
              borderRadius: 2,
              position: "relative",
              boxShadow: "2px 2px 0 #e2e8f0",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 4,
                border: "1px dashed #bfdbfe",
                borderRadius: 1,
                opacity: 0.6,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 5,
                left: 4,
                right: 4,
                height: 5,
                background: "#2563eb22",
                borderRadius: 1,
              }}
            />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: 12 + i * 5,
                  left: 4,
                  right: 4,
                  height: 2.5,
                  background: `${T.border}`,
                  borderRadius: 1,
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                bottom: 5,
                left: 4,
                right: 4,
                height: 4,
                background: "#7c3aed22",
                borderRadius: 1,
              }}
            />
          </div>
        </div>
      </div>

      <PropSection
        label="Paper"
        color="#64748b"
        icon={<Maximize2 size={9} />}
        isOpen={openSection === "paper"}
        onToggle={() => setOpenSection(openSection === "paper" ? "" : "paper")}
      >
        <PropGrid2>
          <div>
            <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Size</div>
            <Select
              value={reportState.page.size}
              onChange={(v) => up("page.size", v)}
              options={["A4", "A3", "LETTER", "LEGAL"]}
            />
          </div>
          <div>
            <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Orientation</div>
            <Select
              value={reportState.page.orientation}
              onChange={(v) => up("page.orientation", v)}
              options={[
                { v: "portrait", l: "Portrait" },
                { v: "landscape", l: "Landscape" },
              ]}
            />
          </div>
        </PropGrid2>
      </PropSection>

      <PropSection
        label="Margins"
        color="#d97706"
        icon={<Frame size={9} />}
        isOpen={openSection === "margins"}
        onToggle={() => setOpenSection(openSection === "margins" ? "" : "margins")}
      >
        <SpacingInput
          label="Margin"
          value={reportState.page.margin}
          onChange={(v) => up("page.margin", v)}
        />
      </PropSection>

      <PropSection
        label="Output"
        color="#0891b2"
        icon={<Database size={9} />}
        isOpen={openSection === "output"}
        onToggle={() => setOpenSection(openSection === "output" ? "" : "output")}
      >
        <PropGrid2>
          <PropCell
            label="Compress (0-9)"
            value={reportState.compressLevel}
            onChange={(v) => up("compressLevel", v)}
            min={0}
            max={9}
          />
          <div />
        </PropGrid2>
        <Toggle
          label="Memory Reduce"
          value={reportState.memoryReduce}
          onChange={(v) => up("memoryReduce", v)}
        />
      </PropSection>
    </div>
  );
}
