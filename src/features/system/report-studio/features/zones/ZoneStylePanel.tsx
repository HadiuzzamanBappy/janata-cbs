import {
  BoxSelect,
  Check,
  Eye,
  Frame,
  Hash,
  Palette,
  PanelBottom,
  PanelTop,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { ColorInput } from "../../components/form/ColorInput";
import { RadiusInput } from "../../components/form/RadiusInput";
import { SpacingInput } from "../../components/form/SpacingInput";
import { PropCell } from "../../components/layout/PropCell";
import { PropGrid2 } from "../../components/layout/PropGrid2";
import { PropSection } from "../../components/layout/PropSection";
import { inputStyle } from "../../theme/inputStyle";
import { T } from "../../theme/tokens";
import type { Zone, ZonePageShow, ZonePageVisibility } from "../../types/zone";

/**
 * Style panel for a zone (header / footer). Tabs: Appearance, Spacing,
 * Radius, Visibility.
 *
 * Visibility tab handles per-page rendering rules (all / first / last /
 * except-first / except-last / odd / even / custom). Custom uses a
 * comma-separated input that's parsed to a numeric array on every keystroke.
 */
export function ZoneStylePanel({
  zone,
  data,
  onUpdate,
}: {
  zone: string;
  data: Zone;
  onUpdate: (z: Zone) => void;
}) {
  const up = (k: string, v: any) => onUpdate({ ...data, [k]: v });
  const color = zone === "header" ? "#2563eb" : "#7c3aed";
  const Icon = zone === "header" ? PanelTop : PanelBottom;

  type ZoneTab = "appearance" | "spacing" | "radius" | "visibility";
  const [activeTab, setActiveTab] = useState<ZoneTab>("appearance");

  const vis: ZonePageVisibility = data.pageVisibility ?? { showOn: "all" };
  const upVis = (v: ZonePageVisibility) => onUpdate({ ...data, pageVisibility: v });
  const [customPagesText, setCustomPagesText] = useState<string>(
    (vis.customPages ?? []).join(", "),
  );

  return (
    <div style={{ fontSize: 11 }}>
      <div
        style={{
          background: `${color}08`,
          border: `1px solid ${color}22`,
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
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
          <Icon size={14} />
        </div>
        <div>
          <div
            style={{ fontSize: 12, fontWeight: 700, color: T.text, textTransform: "capitalize" }}
          >
            {zone} Band
          </div>
          <div style={{ fontSize: 8.5, color: `${color}99`, marginTop: 1 }}>
            Band background & spacing
          </div>
        </div>
      </div>

      <PropSection
        label="Band Style"
        color={color}
        icon={<Settings2 size={9} />}
        defaultOpen={true}
      >
        <div
          style={{
            display: "flex",
            gap: 3,
            marginBottom: 10,
            background: T.bg2,
            padding: 3,
            borderRadius: 6,
            border: `1px solid ${T.border}`,
          }}
        >
          {(
            [
              { id: "appearance", label: "Style", icon: <Palette size={10} />, color: color },
              { id: "spacing", label: "Spacing", icon: <Frame size={10} />, color: "#64748b" },
              { id: "radius", label: "Radius", icon: <BoxSelect size={10} />, color: "#0891b2" },
              { id: "visibility", label: "Pages", icon: <Eye size={10} />, color: "#059669" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ZoneTab)}
              style={{
                flex: 1,
                padding: "6px 4px",
                fontSize: 9,
                fontWeight: 700,
                color: activeTab === tab.id ? "#fff" : T.muted,
                background: activeTab === tab.id ? tab.color : "transparent",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "appearance" && (
          <>
            <ColorInput
              label="Background"
              value={data.background}
              onChange={(v) => up("background", v)}
            />
            <ColorInput
              label="Font Color"
              value={data.fontColor}
              onChange={(v) => up("fontColor", v)}
            />
            {zone === "footer" && (
              <PropGrid2>
                <PropCell
                  label="Height (mm)"
                  value={data.height}
                  onChange={(v) => up("height", v)}
                  min={0}
                />
                <PropCell
                  label="Min Height"
                  value={data.minHeight ?? 20}
                  onChange={(v) => up("minHeight", v)}
                  min={0}
                />
              </PropGrid2>
            )}
            {zone === "header" && (
              <PropCell
                label="Min Height (mm)"
                value={data.minHeight ?? 20}
                onChange={(v) => up("minHeight", v)}
                min={0}
              />
            )}
          </>
        )}

        {activeTab === "spacing" && (
          <>
            <SpacingInput label="Padding" value={data.padding} onChange={(v) => up("padding", v)} />
            <SpacingInput label="Margin" value={data.margin} onChange={(v) => up("margin", v)} />
          </>
        )}

        {activeTab === "radius" && (
          <RadiusInput
            value={data.radius}
            onChange={(v) => onUpdate({ ...data, radius: v })}
            color={color}
          />
        )}

        {activeTab === "visibility" &&
          (() => {
            const showOnOptions: { v: ZonePageShow; label: string; desc: string; icon: string }[] =
              [
                { v: "all", label: "All Pages", desc: "Render on every page", icon: "≡" },
                {
                  v: "first_only",
                  label: "First Page Only",
                  desc: "Render only on page 1",
                  icon: "①",
                },
                {
                  v: "last_only",
                  label: "Last Page Only",
                  desc: "Render only on the final page",
                  icon: "⑴",
                },
                {
                  v: "except_first",
                  label: "Except First",
                  desc: "Skip page 1, render on all others",
                  icon: "①̶",
                },
                {
                  v: "except_last",
                  label: "Except Last",
                  desc: "Skip final page, render on others",
                  icon: "⑴̶",
                },
                {
                  v: "odd_pages",
                  label: "Odd Pages",
                  desc: "Render on pages 1, 3, 5 …",
                  icon: "⊞",
                },
                {
                  v: "even_pages",
                  label: "Even Pages",
                  desc: "Render on pages 2, 4, 6 …",
                  icon: "⊟",
                },
                {
                  v: "custom",
                  label: "Custom Pages",
                  desc: "Choose specific page numbers",
                  icon: "#",
                },
              ];
            return (
              <div>
                <div
                  style={{
                    background: `${color}10`,
                    border: `1px solid ${color}30`,
                    borderRadius: 7,
                    padding: "7px 10px",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Eye size={11} color={color} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.text }}>
                      {showOnOptions.find((o) => o.v === vis.showOn)?.label ?? "All Pages"}
                    </div>
                    <div style={{ fontSize: 8.5, color: T.muted }}>
                      {showOnOptions.find((o) => o.v === vis.showOn)?.desc}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                  {showOnOptions.map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => upVis({ ...vis, showOn: opt.v })}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 10px",
                        borderRadius: 7,
                        cursor: "pointer",
                        textAlign: "left",
                        border:
                          vis.showOn === opt.v ? `1.5px solid ${color}` : `1px solid ${T.border}`,
                        background: vis.showOn === opt.v ? `${color}10` : T.bg,
                        transition: "all .12s",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          width: 18,
                          textAlign: "center",
                          color,
                          flexShrink: 0,
                          lineHeight: 1,
                        }}
                      >
                        {opt.icon}
                      </span>
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: vis.showOn === opt.v ? 700 : 500,
                            color: vis.showOn === opt.v ? color : T.text,
                          }}
                        >
                          {opt.label}
                        </div>
                        <div style={{ fontSize: 8, color: T.muted }}>{opt.desc}</div>
                      </div>
                      {vis.showOn === opt.v && (
                        <Check
                          size={11}
                          color={color}
                          style={{ marginLeft: "auto", flexShrink: 0 }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {vis.showOn === "custom" && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 7,
                      padding: "8px 10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: "#059669",
                        fontWeight: 700,
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Hash size={9} />
                      Page Numbers (comma-separated)
                    </div>
                    <input
                      style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11 }}
                      value={customPagesText}
                      placeholder="e.g. 1, 3, 5"
                      onChange={(e) => {
                        setCustomPagesText(e.target.value);
                        const pages = e.target.value
                          .split(",")
                          .map((s) => parseInt(s.trim(), 10))
                          .filter((n) => !isNaN(n) && n > 0);
                        upVis({ ...vis, customPages: pages });
                      }}
                    />
                    <div style={{ fontSize: 8, color: T.muted, marginTop: 4 }}>
                      Enter page numbers where this {zone} should appear.
                      {(vis.customPages ?? []).length > 0 && (
                        <span style={{ color: "#059669", fontWeight: 600 }}>
                          {" "}
                          {(vis.customPages ?? []).length} page(s) selected.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
      </PropSection>
    </div>
  );
}
