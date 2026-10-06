import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, X } from "@/features/reportstudio/theme/icons";
import { T } from "@/features/reportstudio/theme/tokens";
import {
  DEFAULT_TABLE_STYLE,
  TSW_PRESETS,
  previewStyleOnTable,
  applyStyleToTable,
} from "./quillTableStyle";

// ── Small helper components (used only within this file) ─────────────────────

function TSRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        minHeight: 30,
        padding: "0 12px",
        gap: 8,
      }}
    >
      <span style={{ flex: 1, fontSize: 11, color: T.text }}>{label}</span>
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
      >
        {children}
      </div>
    </div>
  );
}

function TSLbl({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "6px 12px 2px",
        fontSize: 9,
        fontWeight: 700,
        color: T.muted,
        textTransform: "uppercase",
        letterSpacing: ".07em",
      }}
    >
      {children}
    </div>
  );
}

function TSToggle({
  v,
  onChange,
}: {
  v: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        onChange(!v);
      }}
      style={{
        width: 30,
        height: 17,
        borderRadius: 9,
        background: v ? "#2563eb" : "#e2e8f0",
        cursor: "pointer",
        position: "relative",
        transition: "background .15s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 13,
          height: 13,
          top: 2,
          left: v ? 15 : 2,
          borderRadius: "50%",
          background: "#fff",
          transition: "left .15s",
          boxShadow: "0 1px 2px rgba(0,0,0,.25)",
        }}
      />
    </div>
  );
}

function TSNum({
  v,
  onChange,
  min = 0,
  max = 24,
}: {
  v: string;
  onChange: (s: string) => void;
  min?: number;
  max?: number;
}) {
  // Commit immediately on every keystroke so Apply always captures the latest value
  return (
    <input
      type="number"
      value={v}
      min={min}
      max={max}
      step={0.5}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 52,
        padding: "3px 5px",
        border: "1px solid #e2e8f0",
        borderRadius: 4,
        fontSize: 11,
        textAlign: "center",
        outline: "none",
      }}
    />
  );
}

function TSSwatch({
  v,
  onChange,
}: {
  v: string;
  onChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const hex = v || "#ffffff";

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      const pw = 164,
        ph = 230;
      setPos({
        left:
          r.left - pw - 8 < 0
            ? Math.min(r.right + 6, window.innerWidth - pw - 8)
            : r.left - pw - 8,
        top:
          r.top + ph > window.innerHeight
            ? Math.max(8, window.innerHeight - ph - 8)
            : r.top,
      });
    }
    setOpen((o) => !o);
  };

  // Close on outside click
  const paletteRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (
        paletteRef.current &&
        !paletteRef.current.contains(e.target as Node) &&
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    // Delay to avoid catching the opening mousedown
    setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div
      style={{ position: "relative", flexShrink: 0 }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={ref}
        onMouseDown={toggle}
        style={{
          width: 24,
          height: 24,
          borderRadius: 4,
          border: "1.5px solid #e2e8f0",
          background: hex,
          cursor: "pointer",
        }}
        title={hex}
      />
      {open && (
        <div
          ref={paletteRef}
          data-ts-palette="1"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 999999,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.18)",
            padding: 8,
            width: 164,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6,1fr)",
              gap: 3,
              marginBottom: 6,
            }}
          >
            {TSW_PRESETS.map((c) => (
              <div
                key={c}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onChange(c);
                  setOpen(false);
                }}
                title={c}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 3,
                  background: c,
                  cursor: "pointer",
                  border: `2px solid ${c === hex ? "#2563eb" : "transparent"}`,
                  boxSizing: "border-box" as const,
                  outline: "1px solid #e2e8f0",
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderTop: "1px solid #f1f5f9",
              paddingTop: 6,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                background: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#fff",
                border: "1px solid #e2e8f0",
                flexShrink: 0,
              }}
            />
            <input
              value={hex}
              maxLength={7}
              placeholder="#000000"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value))
                  onChange(e.target.value);
              }}
              style={{
                flex: 1,
                padding: "2px 5px",
                border: "1px solid #e2e8f0",
                borderRadius: 4,
                fontSize: 10,
                fontFamily: "monospace",
                outline: "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── QuillTableStylePanel ─────────────────────────────────────────────────────
export const QuillTableStylePanel = ({
  table,
  onClose,
  onBack,
  onSave,
  savedStyle,
}: {
  table: HTMLTableElement;
  onClose: () => void;
  onBack: () => void;
  onSave: (s: typeof DEFAULT_TABLE_STYLE) => void;
  savedStyle?: Record<string, any>;
}) => {
  const initStyle = () => ({ ...DEFAULT_TABLE_STYLE, ...(savedStyle || {}) });

  const [ls, setLs] = useState(initStyle);

  const upd = (patch: Partial<typeof DEFAULT_TABLE_STYLE>) =>
    setLs((prev) => {
      const next = { ...prev, ...patch };
      previewStyleOnTable(table, next);
      return next;
    });

  const apply = () => {
    applyStyleToTable(table, ls);
    onSave(ls);
    onClose();
  };

  const cancel = () => {
    previewStyleOnTable(table, {
      ...DEFAULT_TABLE_STYLE,
      ...(savedStyle || {}),
    });
    onBack();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 10px 8px 12px",
          borderBottom: "1px solid #f1f5f9",
          flexShrink: 0,
        }}
      >
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            cancel();
          }}
          style={{
            display: "flex",
            cursor: "pointer",
            color: "#64748b",
            padding: 2,
            marginRight: 4,
            borderRadius: 4,
          }}
        >
          <ChevronLeft size={13} />
        </div>
        <span
          style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text }}
        >
          Table Style
        </span>
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            display: "flex",
            cursor: "pointer",
            color: T.muted,
            padding: 2,
            borderRadius: 4,
          }}
        >
          <X size={12} />
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <TSLbl>Border</TSLbl>
        <TSRow label="Color">
          <TSSwatch
            v={ls.borderColor}
            onChange={(v) => upd({ borderColor: v })}
          />
        </TSRow>
        <TSRow label="Width (px)">
          <TSNum
            v={ls.borderWidth}
            onChange={(v) => upd({ borderWidth: v })}
            max={8}
          />
        </TSRow>

        <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />
        <TSLbl>Header row</TSLbl>
        <TSRow label="Background">
          <TSSwatch v={ls.headerBg} onChange={(v) => upd({ headerBg: v })} />
        </TSRow>
        <TSRow label="Text color">
          <TSSwatch
            v={ls.headerColor}
            onChange={(v) => upd({ headerColor: v })}
          />
        </TSRow>
        <TSRow label="Bold">
          <TSToggle
            v={ls.headerBold}
            onChange={(v) => upd({ headerBold: v })}
          />
        </TSRow>

        <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />
        <TSLbl>Data rows</TSLbl>
        <TSRow label="Background">
          <TSSwatch v={ls.cellBg} onChange={(v) => upd({ cellBg: v })} />
        </TSRow>
        <TSRow label="Text color">
          <TSSwatch v={ls.cellColor} onChange={(v) => upd({ cellColor: v })} />
        </TSRow>
        <TSRow label="Alternating row">
          <TSToggle
            v={!!ls.altRowBg}
            onChange={(on) => upd({ altRowBg: on ? "#f8fafc" : "" })}
          />
          {ls.altRowBg ? (
            <TSSwatch v={ls.altRowBg} onChange={(v) => upd({ altRowBg: v })} />
          ) : null}
        </TSRow>
        <TSRow label="Font size (px)">
          <TSNum
            v={ls.fontSize}
            onChange={(v) => upd({ fontSize: v })}
            min={7}
            max={24}
          />
        </TSRow>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "8px 10px",
          borderTop: `1px solid ${T.border}`,
          flexShrink: 0,
        }}
      >
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            cancel();
          }}
          style={{
            padding: "6px 12px",
            background: T.bg2,
            color: T.text,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          Cancel
        </button>
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            apply();
          }}
          style={{
            flex: 1,
            padding: "6px 0",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
};
