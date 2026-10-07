import {
  ArrowDown,
  ArrowUp,
  Blend,
  Bold,
  Copy,
  Crosshair,
  Eye,
  EyeOff,
  FileDigit,
  Frame,
  ImageIcon,
  Italic,
  Lock,
  Maximize2,
  Move,
  Spline,
  Square,
  TextCursor,
  Trash2,
  Unlock,
  Upload,
} from "lucide-react";
import { Toggle } from "../../components/common/Toggle";
import { AlignInput } from "../../components/form/AlignInput";
import { ColorInput } from "../../components/form/ColorInput";
import { Input } from "../../components/form/Input";
import { RadiusInput } from "../../components/form/RadiusInput";
import { RotationStrip } from "../../components/form/RotationStrip";
import { Select } from "../../components/form/Select";
import { SpacingInput } from "../../components/form/SpacingInput";
import { PropCell } from "../../components/layout/PropCell";
import { PropGrid2 } from "../../components/layout/PropGrid2";
import { PropRow } from "../../components/layout/PropRow";
import { PropSection } from "../../components/layout/PropSection";
import { PALETTE } from "../../constants/preview-data";
import { inputStyle } from "../../theme/inputStyle";
import { T } from "../../theme/tokens";
import type { ZoneElement } from "../../types/zone";

/**
 * Properties panel for a single zone element (TEXT / LOGO / SEPARATOR /
 * DATE_TIME / PAGE_NUMBER).
 *
 * Branches on `el.type` to surface only the relevant sections. The
 * "Free Position" and "Box & Border" sections are shared across the text-y
 * element types and live as IIFE/closure blocks here — matches the
 * monolith's structure so behaviour is identical (e.g. enabling free
 * position default-zeroes x/y; the box border-side toggles draw the live
 * preview rectangle).
 */
export function ElementPropsPanel({
  el,
  zone,
  onUpdate,
  onDelete,
  onDuplicate,
  onZOrder,
  onSnapAlign,
}: {
  el: ZoneElement;
  zone: "header" | "footer";
  onUpdate: (e: ZoneElement) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onZOrder: (dir: "up" | "down") => void;
  onSnapAlign?: (h: "left" | "center" | "right", v?: "top" | "middle" | "bottom") => void;
}) {
  const cfg = el.config;
  const updateElementConfig = (k: string, v: any) =>
    onUpdate({ ...el, config: { ...cfg, [k]: v } });
  const toggleHidden = () => onUpdate({ ...el, hidden: !el.hidden });
  const toggleLocked = () => onUpdate({ ...el, locked: !el.locked });
  const setOpacity = (v: number) => onUpdate({ ...el, opacity: v });
  const paletteEntry = PALETTE.find((p) => p.type === el.type) as any;
  const PaletteIcon = paletteEntry?.Icon;
  const ac = paletteEntry?.color || "#2563eb";

  return (
    <div style={{ fontSize: 11 }}>
      <div
        style={{
          background: `${ac}09`,
          border: `1px solid ${ac}25`,
          borderRadius: 10,
          padding: "10px 12px",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: `${ac}18`,
              border: `1.5px solid ${ac}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: ac,
              flexShrink: 0,
            }}
          >
            {PaletteIcon && <PaletteIcon size={14} strokeWidth={2.5} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{el.type}</div>
            <div
              style={{
                fontSize: 8.5,
                color: `${ac}99`,
                marginTop: 1,
                textTransform: "capitalize",
              }}
            >
              {zone} band
            </div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {[
              {
                icon: <Eye size={11} />,
                offIcon: <EyeOff size={11} />,
                active: el.hidden,
                onClick: toggleHidden,
                title: el.hidden ? "Show" : "Hide",
              },
              {
                icon: <Unlock size={11} />,
                offIcon: <Lock size={11} />,
                active: el.locked,
                onClick: toggleLocked,
                title: el.locked ? "Unlock" : "Lock",
              },
              {
                icon: <Copy size={11} />,
                offIcon: <Copy size={11} />,
                active: false,
                onClick: onDuplicate,
                title: "Duplicate",
              },
              {
                icon: <Trash2 size={11} />,
                offIcon: <Trash2 size={11} />,
                active: false,
                onClick: onDelete,
                title: "Delete",
              },
            ].map((b) => (
              <button
                key={b.title}
                onClick={b.onClick}
                style={{
                  width: 25,
                  height: 25,
                  borderRadius: 5,
                  cursor: "pointer",
                  border: "1px solid",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  transition: "all .12s",
                  background: b.active ? "#fef3c7" : b.title === "Delete" ? "#fee2e2" : T.bg,
                  borderColor: b.active ? "#fcd34d" : b.title === "Delete" ? "#fca5a5" : T.border,
                  color: b.active ? "#d97706" : b.title === "Delete" ? "#dc2626" : T.muted,
                }}
              >
                {b.active ? b.offIcon : b.icon}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
            marginBottom: 7,
          }}
        >
          <button
            onClick={() => onZOrder("up")}
            title="Bring forward"
            style={{
              flex: 1,
              background: T.bg,
              border: `1px solid ${T.border}`,
              color: T.text,
              padding: "4px 0",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 8.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <ArrowUp size={10} />
            Forward
          </button>
          <span
            style={{
              fontSize: 8.5,
              color: T.muted,
              minWidth: 28,
              textAlign: "center",
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 4,
              padding: "3px 0",
              fontFamily: "monospace",
            }}
          >
            z{el.zIndex ?? 0}
          </span>
          <button
            onClick={() => onZOrder("down")}
            title="Send back"
            style={{
              flex: 1,
              background: T.bg,
              border: `1px solid ${T.border}`,
              color: T.text,
              padding: "4px 0",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 8.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <ArrowDown size={10} />
            Back
          </button>
        </div>

        <div>
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
            <span style={{ fontWeight: 700, color: ac, fontFamily: "monospace" }}>
              {Math.round((el.opacity ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={el.opacity ?? 1}
            onChange={(e) => setOpacity(+e.target.value)}
            style={{ width: "100%", accentColor: ac, height: 4 }}
          />
        </div>
      </div>

      {el.hidden && (
        <div
          style={{
            background: "#fef9ee",
            border: "1px solid #fcd34d",
            borderRadius: 6,
            padding: "4px 9px",
            fontSize: 9,
            color: "#92400e",
            marginBottom: 7,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <EyeOff size={10} />
          Hidden — would not render in PDF
        </div>
      )}
      {el.locked && (
        <div
          style={{
            background: "#fef9ee",
            border: "1px solid #fcd34d",
            borderRadius: 6,
            padding: "4px 9px",
            fontSize: 9,
            color: "#92400e",
            marginBottom: 7,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Lock size={10} />
          Locked — drag disabled
        </div>
      )}

      {(el.type === "TEXT" || el.type === "DATE_TIME") && (
        <PropSection label="Content" color="#2563eb" icon={<TextCursor size={9} />}>
          <div style={{ marginBottom: 7 }}>
            <div style={{ fontSize: 9, color: T.label, marginBottom: 3 }}>Text</div>
            <textarea
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 46,
                lineHeight: 1.4,
              }}
              value={cfg.text || ""}
              onChange={(e) => updateElementConfig("text", e.target.value)}
            />
          </div>
          {el.type === "DATE_TIME" && (
            <PropRow label="Format">
              <Input
                value={cfg.format}
                onChange={(v) => updateElementConfig("format", v)}
                placeholder="yyyy-MM-dd HH:mm"
              />
            </PropRow>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 72px",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <div>
              <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Font</div>
              <Select
                value={cfg.font}
                onChange={(v) => updateElementConfig("font", v)}
                options={["HELVETICA", "TIMES", "COURIER"]}
              />
            </div>
            <div>
              <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Size</div>
              <Input
                type="number"
                value={cfg.fontSize}
                onChange={(v) => updateElementConfig("fontSize", v)}
                min={6}
                max={96}
              />
            </div>
          </div>
          <ColorInput
            label="Color"
            value={cfg.fontColor}
            onChange={(v) => updateElementConfig("fontColor", v)}
          />
          {!cfg.flexmove && (
            <AlignInput
              value={cfg.align || "LEFT"}
              onChange={(v) => updateElementConfig("align", v)}
              options={["LEFT", "CENTER", "RIGHT", "JUSTIFIED"]}
              color={ac}
            />
          )}
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            {(
              [
                {
                  key: "bold",
                  label: "B",
                  icon: <Bold size={12} />,
                  val: !!cfg.bold,
                },
                {
                  key: "italic",
                  label: "I",
                  icon: <Italic size={12} />,
                  val: !!cfg.italic,
                },
              ] as const
            ).map((b) => (
              <button
                key={b.key}
                title={b.key}
                onClick={() => updateElementConfig(b.key, !b.val)}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  borderRadius: 5,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 11,
                  border: `1px solid ${b.val ? "#2563eb" : T.border}`,
                  background: b.val ? "#2563eb" : T.bg2,
                  color: b.val ? "#fff" : T.muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  transition: "all .12s",
                }}
              >
                {b.icon}
                {b.key[0].toUpperCase() + b.key.slice(1)}
              </button>
            ))}
          </div>
        </PropSection>
      )}

      {el.type === "PAGE_NUMBER" && (
        <PropSection label="Page Number" color="#7c3aed" icon={<FileDigit size={9} />}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 72px",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <div>
              <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Font</div>
              <Select
                value={cfg.font}
                onChange={(v) => updateElementConfig("font", v)}
                options={["HELVETICA", "TIMES", "COURIER"]}
              />
            </div>
            <div>
              <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Size</div>
              <Input
                type="number"
                value={cfg.fontSize}
                onChange={(v) => updateElementConfig("fontSize", v)}
                min={6}
              />
            </div>
          </div>
          <ColorInput
            label="Color"
            value={cfg.fontColor}
            onChange={(v) => updateElementConfig("fontColor", v)}
          />
          {!cfg.flexmove && (
            <AlignInput
              value={cfg.align || "LEFT"}
              onChange={(v) => updateElementConfig("align", v)}
              options={["LEFT", "CENTER", "RIGHT"]}
              color={ac}
            />
          )}
        </PropSection>
      )}

      {el.type === "LOGO" && (
        <PropSection label="Logo" color="#059669" icon={<ImageIcon size={9} />}>
          <PropRow label="Image Path">
            <Input
              value={cfg.path}
              onChange={(v) => updateElementConfig("path", v)}
              placeholder="/path/to/logo.png or paste data URL"
            />
          </PropRow>
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
              Upload PNG/JPEG (max 1 MB)
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
                  if (file.size > 1024 * 1024) {
                    alert(`File is ${(file.size / 1024).toFixed(0)} KB — maximum allowed is 1 MB.`);
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = String(reader.result || "");
                    updateElementConfig("path", dataUrl);
                  };
                  reader.onerror = () => alert("Failed to read the file.");
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {cfg.path && cfg.path.startsWith("data:image/") && (
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
                <span>✓ Embedded base64 image ({Math.round(cfg.path.length / 1024)} KB)</span>
                <button
                  onClick={() => updateElementConfig("path", "")}
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
          <PropGrid2>
            <PropCell
              label="W (mm)"
              value={cfg.width}
              onChange={(v) => updateElementConfig("width", v)}
              min={1}
            />
            <PropCell
              label="H (mm)"
              value={cfg.height}
              onChange={(v) => updateElementConfig("height", v)}
              min={1}
            />
          </PropGrid2>
          <PropGrid2>
            <PropCell
              label="X (mm)"
              value={cfg.x ?? 0}
              onChange={(v) => updateElementConfig("x", v)}
            />
            <PropCell
              label="Y (mm)"
              value={cfg.y ?? 0}
              onChange={(v) => updateElementConfig("y", v)}
            />
          </PropGrid2>
          <RotationStrip
            value={cfg.rotation ?? 0}
            onChange={(v) => updateElementConfig("rotation", v)}
            presets={[0, 45, 90, 180, -90, -45]}
          />
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 6,
              padding: "5px 9px",
              fontSize: 9,
              color: "#15803d",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Move size={9} />
            Drag on canvas to reposition freely
          </div>
        </PropSection>
      )}

      {el.type === "SEPARATOR" && (
        <PropSection label="Line" color="#64748b" icon={<Spline size={9} />}>
          <ColorInput
            label="Color"
            value={cfg.color}
            onChange={(v) => updateElementConfig("color", v)}
          />
          <PropGrid2>
            <PropCell
              label="Thickness"
              value={cfg.height ?? 0.8}
              onChange={(v) => updateElementConfig("height", v)}
              min={0.1}
              step={0.1}
            />
            <PropCell
              label="Width %"
              value={cfg.widthPct ?? 100}
              onChange={(v) => updateElementConfig("widthPct", Math.min(100, Math.max(1, +v)))}
              min={1}
              max={100}
            />
          </PropGrid2>
          {!cfg.flexmove && (
            <AlignInput
              value={cfg.align || "LEFT"}
              onChange={(v) => updateElementConfig("align", v)}
              options={["LEFT", "CENTER", "RIGHT"]}
              color={ac}
            />
          )}
          <Toggle
            label="Visible"
            icon={cfg.show ? <Eye size={10} /> : <EyeOff size={10} />}
            value={!!cfg.show}
            onChange={(v) => updateElementConfig("show", v)}
          />
          {!!cfg.flexmove && (
            <PropCell
              label="Width (mm)"
              value={cfg.width ?? 80}
              onChange={(v) => updateElementConfig("width", v)}
              min={5}
            />
          )}
        </PropSection>
      )}

      {(el.type === "TEXT" ||
        el.type === "DATE_TIME" ||
        el.type === "SEPARATOR" ||
        el.type === "PAGE_NUMBER") && (
        <PropSection label="Free Position" color="#0891b2" icon={<Move size={9} />}>
          <Toggle
            label="Enable Free Position"
            icon={<Move size={10} />}
            value={!!cfg.flexmove}
            onChange={(v) => {
              updateElementConfig("flexmove", v);
              if (v && cfg.x === undefined) updateElementConfig("x", 0);
              if (v && cfg.y === undefined) updateElementConfig("y", 0);
            }}
          />
          {!!cfg.flexmove && (
            <>
              <div
                style={{
                  background: "#ecfeff",
                  border: "1px solid #a5f3fc",
                  borderRadius: 6,
                  padding: "5px 9px",
                  fontSize: 8.5,
                  color: "#0e7490",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Move size={9} />
                Drag · ↑↓←→ 1mm · Shift 10mm
              </div>

              <PropGrid2>
                <PropCell
                  label="X (mm)"
                  value={cfg.x ?? 0}
                  onChange={(v) => updateElementConfig("x", v)}
                />
                <PropCell
                  label="Y (mm)"
                  value={cfg.y ?? 0}
                  onChange={(v) => updateElementConfig("y", v)}
                />
              </PropGrid2>
              {el.type !== "SEPARATOR" && (
                <PropCell
                  label="Width (mm)"
                  value={cfg.width ?? 80}
                  onChange={(v) => updateElementConfig("width", +v)}
                  min={5}
                />
              )}

              {el.type !== "SEPARATOR" && (
                <AlignInput
                  label="Content"
                  value={cfg.align || "LEFT"}
                  onChange={(v) => updateElementConfig("align", v)}
                  options={["LEFT", "CENTER", "RIGHT", "JUSTIFIED"]}
                  color="#2563eb"
                />
              )}

              {onSnapAlign && (
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#7c3aed",
                      fontWeight: 600,
                      marginBottom: 5,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Crosshair size={9} />
                    Snap to Band
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 3,
                    }}
                  >
                    {(
                      [
                        { h: "left", v: "top", lbl: "↖ TL" },
                        { h: "center", v: "top", lbl: "⬆ Top" },
                        { h: "right", v: "top", lbl: "↗ TR" },
                        { h: "left", v: "middle", lbl: "⬅ L" },
                        { h: "center", v: "middle", lbl: "⊕ Ctr" },
                        { h: "right", v: "middle", lbl: "➡ R" },
                        { h: "left", v: "bottom", lbl: "↙ BL" },
                        { h: "center", v: "bottom", lbl: "⬇ Bot" },
                        { h: "right", v: "bottom", lbl: "↘ BR" },
                      ] as const
                    ).map(({ h, v, lbl }) => (
                      <button
                        key={h + v}
                        onClick={() => onSnapAlign(h, v)}
                        title={`Snap ${h} ${v}`}
                        style={{
                          padding: "5px 2px",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 8.5,
                          fontWeight: 600,
                          border: `1px solid #ede9fe`,
                          background: "#f5f3ff",
                          color: "#7c3aed",
                          transition: "all .1s",
                        }}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(el.type === "TEXT" || el.type === "DATE_TIME" || el.type === "PAGE_NUMBER") && (
                <div style={{ marginTop: 8 }}>
                  <RotationStrip
                    value={cfg.rotation ?? 0}
                    onChange={(v) => updateElementConfig("rotation", v)}
                    presets={[0, 45, 90, 180, -90, -45]}
                  />
                </div>
              )}
            </>
          )}
        </PropSection>
      )}

      {(el.type === "TEXT" || el.type === "DATE_TIME" || el.type === "PAGE_NUMBER") &&
        (() => {
          const box = cfg.box || {};
          const upBox = (k: string, v: any) => updateElementConfig("box", { ...box, [k]: v });
          return (
            <PropSection
              label="Box & Border"
              color="#0891b2"
              icon={<Square size={9} />}
              defaultOpen={!!box.enabled}
            >
              <Toggle
                label="Enable Box"
                icon={<Maximize2 size={10} />}
                value={!!box.enabled}
                onChange={(v) => upBox("enabled", v)}
              />
              {!!box.enabled && (
                <>
                  <ColorInput
                    label="Border"
                    value={box.borderColor || "#2563eb"}
                    onChange={(v) => upBox("borderColor", v)}
                  />
                  <PropGrid2>
                    <PropCell
                      label="Width"
                      value={box.borderWidth ?? 1}
                      onChange={(v) => upBox("borderWidth", +v)}
                      step={0.5}
                      min={0.5}
                    />
                    <div>
                      <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Style</div>
                      <Select
                        value={box.borderStyle || "solid"}
                        onChange={(v) => upBox("borderStyle", v)}
                        options={["solid", "dashed", "dotted", "double"]}
                      />
                    </div>
                  </PropGrid2>
                  {(() => {
                    const sides: string[] = box.borderSides ?? ["top", "right", "bottom", "left"];
                    const toggle = (side: string) => {
                      const next = sides.includes(side)
                        ? sides.filter((s) => s !== side)
                        : [...sides, side];
                      upBox("borderSides", next);
                    };
                    const all4 = sides.length === 4;
                    const none = sides.length === 0;
                    const pBx = (s: string) =>
                      sides.includes(s) ? `2px solid #0891b2` : `1px dashed #cbd5e1`;
                    return (
                      <div style={{ marginBottom: 8 }}>
                        <div
                          style={{
                            fontSize: 9,
                            color: T.label,
                            marginBottom: 5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                border: "1.5px solid #0891b2",
                                borderRadius: 1,
                                display: "inline-block",
                              }}
                            />
                            Border Sides
                          </span>
                          <div style={{ display: "flex", gap: 3 }}>
                            <button
                              onClick={() =>
                                upBox("borderSides", ["top", "right", "bottom", "left"])
                              }
                              style={{
                                fontSize: 8,
                                padding: "1px 6px",
                                borderRadius: 3,
                                cursor: "pointer",
                                fontWeight: 600,
                                border: `1px solid ${all4 ? "#0891b2" : T.border}`,
                                background: all4 ? "#ecfeff" : T.bg2,
                                color: all4 ? "#0e7490" : T.muted,
                              }}
                            >
                              All
                            </button>
                            <button
                              onClick={() => upBox("borderSides", [])}
                              style={{
                                fontSize: 8,
                                padding: "1px 6px",
                                borderRadius: 3,
                                cursor: "pointer",
                                fontWeight: 600,
                                border: `1px solid ${none ? "#dc2626" : T.border}`,
                                background: none ? "#fee2e2" : T.bg2,
                                color: none ? "#dc2626" : T.muted,
                              }}
                            >
                              None
                            </button>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: 4,
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              width: 84,
                              height: 56,
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: 14,
                                borderTop: pBx("top"),
                                borderRight: pBx("right"),
                                borderBottom: pBx("bottom"),
                                borderLeft: pBx("left"),
                                borderRadius: 2,
                                background: "#f0fdfe",
                              }}
                            />
                            {(
                              [
                                {
                                  side: "top",
                                  pos: {
                                    top: 0,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                  },
                                  w: 36,
                                  h: 12,
                                  lbl: "T",
                                },
                                {
                                  side: "bottom",
                                  pos: {
                                    bottom: 0,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                  },
                                  w: 36,
                                  h: 12,
                                  lbl: "B",
                                },
                                {
                                  side: "left",
                                  pos: {
                                    left: 0,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                  },
                                  w: 12,
                                  h: 24,
                                  lbl: "L",
                                },
                                {
                                  side: "right",
                                  pos: {
                                    right: 0,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                  },
                                  w: 12,
                                  h: 24,
                                  lbl: "R",
                                },
                              ] as const
                            ).map((b) => (
                              <button
                                key={b.side}
                                onClick={() => toggle(b.side)}
                                title={`Toggle ${b.side} border`}
                                style={{
                                  position: "absolute",
                                  ...(b.pos as any),
                                  width: b.w,
                                  height: b.h,
                                  borderRadius: 3,
                                  cursor: "pointer",
                                  fontSize: 7.5,
                                  fontWeight: 700,
                                  border: `1px solid ${
                                    sides.includes(b.side) ? "#0891b2" : T.border
                                  }`,
                                  background: sides.includes(b.side) ? "#0891b2" : T.bg2,
                                  color: sides.includes(b.side) ? "#fff" : T.muted,
                                }}
                              >
                                {b.lbl}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 8,
                            color: sides.length > 0 ? "#0e7490" : T.muted,
                            textAlign: "center",
                            background: sides.length > 0 ? "#ecfeff" : "transparent",
                            border: sides.length > 0 ? "1px solid #a5f3fc" : "none",
                            borderRadius: 4,
                            padding: sides.length > 0 ? "2px 0" : "0",
                          }}
                        >
                          {sides.length === 0
                            ? "No borders"
                            : sides.length === 4
                              ? "All borders"
                              : sides.map((s) => s[0].toUpperCase() + s.slice(1)).join(" + ")}
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{ marginBottom: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 9,
                        color: T.label,
                        marginBottom: 3,
                      }}
                    >
                      <span>Box Opacity</span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: T.text,
                          fontFamily: "monospace",
                        }}
                      >
                        {Math.round((box.opacity ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={box.opacity ?? 1}
                      onChange={(e) => upBox("opacity", +e.target.value)}
                      style={{
                        width: "100%",
                        accentColor: "#0891b2",
                        height: 4,
                      }}
                    />
                  </div>
                  <RadiusInput
                    value={
                      box.radius && typeof box.radius === "object"
                        ? box.radius
                        : {
                            topLeft: box.radius || 0,
                            topRight: box.radius || 0,
                            bottomLeft: box.radius || 0,
                            bottomRight: box.radius || 0,
                          }
                    }
                    onChange={(v) => upBox("radius", v)}
                    color="#0891b2"
                  />
                  <SpacingInput
                    label="Box Padding"
                    value={box.padding || { top: 4, bottom: 4, left: 6, right: 6 }}
                    onChange={(v) => upBox("padding", v)}
                  />
                  <PropGrid2>
                    <PropCell
                      label="Box H (pt)"
                      value={box.height ?? 0}
                      onChange={(v) => upBox("height", +v)}
                      min={0}
                      step={1}
                    />
                    <div>
                      <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>V-Align</div>
                      <Select
                        value={box.verticalAlign || "top"}
                        onChange={(v) => upBox("verticalAlign", v)}
                        options={["top", "middle", "bottom"]}
                      />
                    </div>
                  </PropGrid2>
                </>
              )}
            </PropSection>
          );
        })()}

      <PropSection label="Spacing" color="#64748b" icon={<Frame size={9} />} defaultOpen={false}>
        <SpacingInput
          label="Margin"
          value={cfg.margin}
          onChange={(v) => updateElementConfig("margin", v)}
        />
      </PropSection>
    </div>
  );
}
