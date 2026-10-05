import type { CSSProperties } from "react";
import {
  Bold,
  Columns3,
  Database,
  FileDigit,
  Filter,
  Hash,
  Italic,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  Type,
  X,
} from "lucide-react";
import type { Column } from "../../types/table";
import { T } from "../../theme/tokens";
import { inputStyle } from "../../theme/inputStyle";
import { deepClone } from "../../utils/deepClone";
import { headerToDataKey } from "../../utils/string";
import { formatColNumber } from "../../utils/number-format";
import { PropSection } from "../../components/layout/PropSection";
import { PropRow } from "../../components/layout/PropRow";
import { PropGrid2 } from "../../components/layout/PropGrid2";
import { PropCell } from "../../components/layout/PropCell";
import { Input } from "../../components/form/Input";
import { Select } from "../../components/form/Select";
import { ColorInput } from "../../components/form/ColorInput";
import { AlignInput } from "../../components/form/AlignInput";
import { Swatch } from "../../components/form/Swatch";
import { Toggle } from "../../components/common/Toggle";

/**
 * Properties panel for a single TABLE column.
 *
 * Auto/custom `dataKey` sync: while the user hasn't manually edited the
 * data key, changing the header text re-derives it via `headerToDataKey`.
 * Editing the data key by hand breaks the sync ("custom" state); the
 * adjacent ⟳ button restores it.
 *
 * Conditional formatting rows render a live-styled `<input>` so the user
 * sees the effective text style without leaving the panel.
 */
export function ColumnPropsPanel({
  col,
  onUpdate,
  onDelete,
}: {
  col: Column;
  onUpdate: (c: Column) => void;
  onDelete: () => void;
}) {
  const up = (k: string, v: any) => onUpdate({ ...col, [k]: v });
  const upAgg = (k: string, v: any) =>
    onUpdate({
      ...col,
      aggregate: {
        ...(col.aggregate || { function: "sum", color: "#dc2626", pageWise: true, showTotal: true }),
        [k]: v,
      },
    });
  const autoKey = headerToDataKey(col.header);
  const isSynced = col.dataKey === autoKey;
  const handleHeaderChange = (h: string) => {
    if (isSynced) {
      onUpdate({ ...col, header: h, dataKey: headerToDataKey(h) });
    } else {
      onUpdate({ ...col, header: h });
    }
  };
  const handleDataKeyChange = (raw: string) => {
    onUpdate({
      ...col,
      dataKey: raw.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-"),
    });
  };

  return (
    <div style={{ fontSize: 11 }}>
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: "#059669" + "18", border: "1.5px solid #059669" + "44",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#059669", flexShrink: 0,
            }}
          >
            <Columns3 size={13} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {col.header}
            </div>
            <div style={{ fontSize: 8.5, fontFamily: "monospace", color: isSynced ? "#16a34a" : "#b45309", marginTop: 1 }}>
              {col.dataKey || "—"}
            </div>
          </div>
          <button
            onClick={onDelete}
            title="Delete column"
            style={{
              width: 26, height: 26,
              background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626",
              borderRadius: 5, cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      <PropSection label="Identity" color="#059669" icon={<Type size={9} />}>
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Header Name</div>
          <Input value={col.header} onChange={handleHeaderChange} />
        </div>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 9, color: T.label, marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
            <Database size={8} />
            Data Key
            <span style={{ marginLeft: "auto", fontSize: 8, color: isSynced ? "#16a34a" : "#b45309", fontWeight: 600 }}>
              {isSynced ? "⟳ auto" : "✎ custom"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <input
              value={col.dataKey || ""}
              onChange={e => handleDataKeyChange(e.target.value)}
              placeholder={autoKey}
              spellCheck={false}
              style={{
                ...inputStyle, fontFamily: "monospace",
                fontSize: 10.5, flex: 1,
                borderColor: isSynced ? "#bbf7d0" : "#fcd34d",
                background: isSynced ? "#f0fdf4" : "#fffbeb",
              }}
            />
            {!isSynced && (
              <button
                title="Reset to auto-derived key"
                onClick={() => onUpdate({ ...col, dataKey: autoKey })}
                style={{
                  flexShrink: 0, background: T.bg2,
                  border: `1px solid ${T.border}`, borderRadius: 5,
                  color: T.label, cursor: "pointer",
                  padding: "0 8px", fontSize: 9, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 2,
                }}
              >
                <RefreshCw size={9} />
                Auto
              </button>
            )}
          </div>
        </div>
        <PropGrid2>
          <PropCell label="Width (mm)" value={col.width} onChange={v => up("width", v)} step={0.1} min={0.1} />
          <div>
            <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Format</div>
            <Select
              value={col.format || "none"}
              onChange={v => up("format", v === "none" ? null : v)}
              options={[
                { v: "none", l: "—" },
                { v: "currency", l: "$" },
                { v: "date", l: "Date" },
                { v: "number", l: "Num" },
              ]}
            />
          </div>
        </PropGrid2>

        {(col.format === "currency" || col.format === "number") && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 7, padding: "8px 10px", marginBottom: 6 }}>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: "#059669", marginBottom: 7, display: "flex", alignItems: "center", gap: 4 }}>
              <Hash size={9} />
              Numeric Formatting
            </div>
            <PropGrid2>
              <PropCell
                label="Decimals"
                value={col.decimals ?? 0}
                onChange={v => up("decimals", Math.max(0, Math.min(8, Math.round(Number(v)))))}
                step={1}
                min={0}
                max={8}
              />
              <div>
                <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Rounding</div>
                <Select
                  value={col.rounding || "none"}
                  onChange={v => up("rounding", v === "none" ? undefined : v)}
                  options={[
                    { v: "none", l: "Default" },
                    { v: "round", l: "Round" },
                    { v: "floor", l: "Floor ▼" },
                    { v: "ceil", l: "Ceil ▲" },
                  ]}
                />
              </div>
            </PropGrid2>
            <div
              style={{
                marginTop: 6, padding: "4px 8px",
                background: "#fff", borderRadius: 5,
                border: "1px solid #d1fae5",
                fontSize: 9.5, fontFamily: "monospace",
                color: "#059669", textAlign: "center",
              }}
            >
              {formatColNumber(1234567.89, col)} · {formatColNumber(-42.5, col)} · {formatColNumber(0, col)}
            </div>
          </div>
        )}
        <AlignInput
          label="Align"
          value={col.align || "LEFT"}
          onChange={v => up("align", v)}
          options={["LEFT", "CENTER", "RIGHT", "JUSTIFIED"]}
          color="#059669"
        />
      </PropSection>

      <PropSection label="Presets" color="#0891b2" icon={<FileDigit size={9} />} defaultOpen={false}>
        <PropRow label="Header">
          <Input value={col.headerPreset || ""} onChange={v => up("headerPreset", v)} placeholder="header" />
        </PropRow>
        <PropRow label="Data">
          <Input value={col.dataPreset || ""} onChange={v => up("dataPreset", v)} placeholder="normal" />
        </PropRow>
      </PropSection>

      <PropSection label="Aggregate" color="#d97706" icon={<SlidersHorizontal size={9} />} defaultOpen={!!col.aggregate}>
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Function</div>
          <Select
            value={col.aggregate?.function || "none"}
            onChange={v =>
              onUpdate({
                ...col,
                aggregate:
                  v === "none"
                    ? undefined
                    : {
                        ...(col.aggregate || {}),
                        function: v,
                        color: col.aggregate?.color || "#dc2626",
                        pageWise: col.aggregate?.pageWise ?? true,
                        showTotal: col.aggregate?.showTotal ?? true,
                      },
              })
            }
            options={[
              { v: "none", l: "None — off" },
              "sum",
              "avg",
              "count",
              "min",
              "max",
            ]}
          />
        </div>
        {col.aggregate && (
          <>
            <ColorInput label="Color" value={col.aggregate.color || "#dc2626"} onChange={v => upAgg("color", v)} />
            <Toggle label="Page Wise" value={!!col.aggregate.pageWise} onChange={v => upAgg("pageWise", v)} />
            <Toggle label="Show Total" value={!!col.aggregate.showTotal} onChange={v => upAgg("showTotal", v)} />
          </>
        )}
      </PropSection>

      <PropSection
        label="Conditions"
        color="#dc2626"
        icon={<Filter size={9} />}
        defaultOpen={(col.conditions || []).length > 0}
        onAdd={() =>
          up("conditions", [
            ...(col.conditions || []),
            { when: "value > 0", fontColor: "#dc2626", bold: false, italic: false, bgColor: "", usePreset: "" },
          ])
        }
        addLabel="+ Add"
      >
        {(col.conditions || []).length === 0 && (
          <div style={{ fontSize: 9, color: T.muted, textAlign: "center", padding: "6px 0", fontStyle: "italic" }}>
            No conditions yet
          </div>
        )}
        {(col.conditions || []).length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 18px 18px 18px 18px 16px",
              gap: 3,
              alignItems: "center",
              padding: "0 2px 3px 2px",
              borderBottom: "1px solid #fecaca",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 7.5, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              When
            </span>
            <span style={{ fontSize: 7, color: T.muted, textAlign: "center" }} title="Font color">A</span>
            <span style={{ fontSize: 7, color: T.muted, textAlign: "center" }} title="Cell background">▩</span>
            <span style={{ fontSize: 7, color: T.muted, textAlign: "center", fontWeight: 700 }} title="Bold">B</span>
            <span style={{ fontSize: 7, color: T.muted, textAlign: "center", fontStyle: "italic" }} title="Italic">I</span>
            <span />
          </div>
        )}
        {(col.conditions || []).map((cond, ci) => {
          const upC = (k: string, v: any) => {
            const c2 = deepClone(col.conditions!);
            (c2[ci] as any)[k] = v;
            up("conditions", c2);
          };
          const previewStyle: CSSProperties = {
            color: cond.fontColor || undefined,
            fontWeight: cond.bold ? 700 : 400,
            fontStyle: cond.italic ? "italic" : "normal",
            background: cond.bgColor || "transparent",
          };
          return (
            <div
              key={ci}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 18px 18px 18px 18px 16px",
                gap: 3, alignItems: "center",
                padding: "3px 2px", borderRadius: 5,
                background: ci % 2 === 0 ? "#fff" : "#fef2f2",
                border: "1px solid #fecaca", marginBottom: 3,
              }}
            >
              <input
                value={cond.when}
                onChange={e => upC("when", e.target.value)}
                title={`Rule ${ci + 1}: ${cond.when}`}
                placeholder="value > 0"
                style={{
                  ...previewStyle,
                  fontSize: 9, fontFamily: "monospace",
                  border: "none", outline: "none", background: "transparent",
                  width: "100%", padding: "1px 3px",
                  borderRadius: 3, minWidth: 0,
                }}
              />
              <Swatch value={cond.fontColor || ""} onChange={v => upC("fontColor", v)} title="Font color" checkerboard={!cond.fontColor} />
              <Swatch value={cond.bgColor || ""} onChange={v => upC("bgColor", v)} title="Cell background" checkerboard={!cond.bgColor} />
              <button
                onClick={() => upC("bold", !cond.bold)}
                title="Bold"
                style={{
                  width: 18, height: 18, borderRadius: 3,
                  border: `1px solid ${cond.bold ? "#dc2626" : "#fecaca"}`,
                  background: cond.bold ? "#fee2e2" : "transparent",
                  color: cond.bold ? "#dc2626" : "#fca5a5",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 0, flexShrink: 0,
                }}
              >
                <Bold size={9} />
              </button>
              <button
                onClick={() => upC("italic", !cond.italic)}
                title="Italic"
                style={{
                  width: 18, height: 18, borderRadius: 3,
                  border: `1px solid ${cond.italic ? "#dc2626" : "#fecaca"}`,
                  background: cond.italic ? "#fee2e2" : "transparent",
                  color: cond.italic ? "#dc2626" : "#fca5a5",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 0, flexShrink: 0,
                }}
              >
                <Italic size={9} />
              </button>
              <button
                onClick={() => up("conditions", col.conditions!.filter((_, i) => i !== ci))}
                title="Remove rule"
                style={{
                  width: 16, height: 16, borderRadius: 3,
                  border: "none", background: "none",
                  color: "#fca5a5", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 0, flexShrink: 0,
                }}
              >
                <X size={9} />
              </button>
            </div>
          );
        })}
      </PropSection>
    </div>
  );
}
