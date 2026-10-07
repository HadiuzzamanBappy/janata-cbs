import {
  Blend,
  FileImage,
  LayoutGrid,
  Link,
  Palette,
  RotateCw,
  Square,
  Type,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Toggle } from "../../components/common/Toggle";
import { AlignInput } from "../../components/form/AlignInput";
import { ColorInput } from "../../components/form/ColorInput";
import { Input } from "../../components/form/Input";
import { RadiusInput } from "../../components/form/RadiusInput";
import { RotationStrip } from "../../components/form/RotationStrip";
import { Select } from "../../components/form/Select";
import { PropCell } from "../../components/layout/PropCell";
import { PropGrid2 } from "../../components/layout/PropGrid2";
import { T } from "../../theme/tokens";
import type { BodyComponent } from "../../types/body";
import { BodyCompHeader } from "../body/BodyCompHeader";
import { BodyLayoutSection } from "../body/BodyLayoutSection";
import { BODY_COMP_META } from "../body/meta";

/**
 * IMAGE body-component properties panel.
 *
 * Three tabs:
 *   - Content: image upload (base64), path/URL input, dimensions, alignment.
 *   - Style:   rotation, opacity, optional border, caption.
 *   - Layout:  shared `BodyLayoutSection`.
 *
 * The data-source props (`centralData`, `componentDataSources`) are passed
 * through unchanged from the parent so future "image from URL field" wiring
 * works without refactor. They are unused at the moment which is identical
 * to the monolith.
 */
export function ImagePropsPanel({
  comp,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  comp: BodyComponent;
  onUpdate: (c: BodyComponent) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  centralData?: Record<string, any[]>;
  onUpdateCentralData?: (cd: Record<string, any[]>) => void;
  componentDataSources?: Record<string, any[]>;
  onUpdateComponentDataSources?: (cds: Record<string, any[]>) => void;
}) {
  const up = (k: keyof BodyComponent, v: any) => onUpdate({ ...comp, [k]: v });
  const upBox = (k: string, v: any) =>
    onUpdate({ ...comp, imageBorder: { ...(comp.imageBorder || {}), [k]: v } });
  const m = BODY_COMP_META.IMAGE;
  const brd = comp.imageBorder || {};

  type ImgTab = "content" | "style" | "layout";
  const [activeTab, setActiveTab] = useState<ImgTab>("content");

  return (
    <div style={{ fontSize: 11 }}>
      <BodyCompHeader
        comp={comp}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        color={m.color}
        Icon={m.Icon}
      />

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
            { id: "content", label: "Content", icon: <FileImage size={10} />, color: m.color },
            { id: "style", label: "Style", icon: <Palette size={10} />, color: "#7c3aed" },
            { id: "layout", label: "Layout", icon: <LayoutGrid size={10} />, color: "#0891b2" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ImgTab)}
            style={{
              flex: 1,
              padding: "6px 8px",
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
              gap: 4,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "content" && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "#f0fdf4",
                border: "1px dashed #86efac",
                color: "#059669",
                padding: "7px 0",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              <Upload size={11} />
              Upload Image (PNG/JPEG, max 5 MB)
              <input
                type="file"
                accept="image/png,image/jpeg"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  if (file.type !== "image/png" && file.type !== "image/jpeg") {
                    alert("Only PNG and JPEG files are supported.");
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    alert(
                      `File is ${(file.size / (1024 * 1024)).toFixed(1)} MB — maximum allowed is 5 MB.`,
                    );
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = String(reader.result || "");
                    up("imagePath", dataUrl);
                  };
                  reader.onerror = () => alert("Failed to read the file.");
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {comp.imagePath && comp.imagePath.startsWith("data:image/") && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 4,
                  padding: "3px 6px",
                  background: "#ecfdf5",
                  border: "1px solid #bbf7d0",
                  borderRadius: 4,
                  fontSize: 9,
                  color: "#166534",
                }}
              >
                <span>
                  ✓ Embedded base64 image ({Math.round(comp.imagePath.length / 1024).toFixed(0)} KB)
                </span>
                <button
                  onClick={() => up("imagePath", "")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                fontSize: 9,
                color: T.label,
                marginBottom: 2,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Link size={9} />
              Path / URL <span style={{ color: T.muted }}>· or upload above</span>
            </div>
            <Input
              value={comp.imagePath || ""}
              onChange={(v) => up("imagePath", v)}
              placeholder="/images/photo.png"
            />
          </div>
          <PropGrid2>
            <PropCell
              label="W (mm)"
              value={comp.imageWidth || 80}
              onChange={(v) => up("imageWidth", v)}
              min={1}
            />
            <PropCell
              label="H (mm)"
              value={comp.imageHeight || 60}
              onChange={(v) => up("imageHeight", v)}
              min={1}
            />
          </PropGrid2>
          <AlignInput
            label="Position"
            value={comp.imageAlign || "CENTER"}
            onChange={(v) => up("imageAlign", v as any)}
            options={["LEFT", "CENTER", "RIGHT"]}
            color={m.color}
          />
        </>
      )}

      {activeTab === "style" && (
        <>
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 9,
                color: T.label,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <RotateCw size={9} />
              Rotation
            </div>
            <RotationStrip
              value={comp.imageRotation || 0}
              onChange={(v) => up("imageRotation", v)}
              presets={[0, 45, 90, 180, -90, -45]}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 9,
                color: T.label,
                marginBottom: 3,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Blend size={9} />
                Opacity
              </span>
              <span style={{ fontWeight: 700, color: "#7c3aed", fontFamily: "monospace" }}>
                {Math.round((comp.imageOpacity ?? 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={comp.imageOpacity ?? 1}
              onChange={(e) => up("imageOpacity", +e.target.value)}
              style={{ width: "100%", accentColor: "#7c3aed", height: 4 }}
            />
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, marginBottom: 10 }}>
            <Toggle
              label={
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Square size={10} />
                  Show Border
                </span>
              }
              value={!!brd.enabled}
              onChange={(v) => upBox("enabled", v)}
            />
            {!!brd.enabled && (
              <>
                <ColorInput
                  label="Color"
                  value={brd.color || "#cbd5e1"}
                  onChange={(v) => upBox("color", v)}
                />
                <PropGrid2>
                  <PropCell
                    label="Width"
                    value={brd.width ?? 1}
                    onChange={(v) => upBox("width", +v)}
                    min={0.5}
                    step={0.5}
                  />
                  <div>
                    <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Style</div>
                    <Select
                      value={brd.style || "solid"}
                      onChange={(v) => upBox("style", v)}
                      options={["solid", "dashed", "dotted"]}
                    />
                  </div>
                </PropGrid2>
                <RadiusInput
                  value={
                    comp.imageRadius || { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 }
                  }
                  onChange={(v) => up("imageRadius", v)}
                  color="#0891b2"
                />
              </>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
            <div
              style={{
                fontSize: 9,
                color: T.label,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Type size={9} />
              Caption
            </div>
            <div style={{ marginBottom: 6 }}>
              <Input
                value={comp.imageCaption || ""}
                onChange={(v) => up("imageCaption", v)}
                placeholder="Figure 1: …"
              />
            </div>
            {comp.imageCaption && (
              <>
                <ColorInput
                  label="Color"
                  value={comp.imageCaptionColor || "#64748b"}
                  onChange={(v) => up("imageCaptionColor", v)}
                />
                <PropGrid2>
                  <PropCell
                    label="Size (pt)"
                    value={comp.imageCaptionSize || 8}
                    onChange={(v) => up("imageCaptionSize", v)}
                    min={6}
                    max={16}
                  />
                  <div>
                    <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Align</div>
                    <Select
                      value={comp.imageCaptionAlign || "center"}
                      onChange={(v) => up("imageCaptionAlign", v)}
                      options={["left", "center", "right"]}
                    />
                  </div>
                </PropGrid2>
              </>
            )}
          </div>
        </>
      )}

      {activeTab === "layout" && <BodyLayoutSection comp={comp} onUpdate={onUpdate} />}
    </div>
  );
}
