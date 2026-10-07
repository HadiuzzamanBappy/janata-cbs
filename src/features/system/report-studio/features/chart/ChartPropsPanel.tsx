import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BarChart2,
  Bold,
  ChevronDown,
  Database,
  Italic,
  LayoutGrid,
  List,
  PieChart,
  RefreshCw,
  Settings2,
  TrendingUp,
  Type,
  X,
} from "lucide-react";
import { useState } from "react";
import { Toggle } from "../../components/common/Toggle";
import { ColorInput } from "../../components/form/ColorInput";
import { Input } from "../../components/form/Input";
import { PropRow } from "../../components/layout/PropRow";
import { PropSection } from "../../components/layout/PropSection";
import { inputStyle } from "../../theme/inputStyle";
import { T } from "../../theme/tokens";
import type { BodyComponent } from "../../types/body";
import { BodyCompHeader } from "../body/BodyCompHeader";
import { BodyLayoutSection } from "../body/BodyLayoutSection";
import { BODY_COMP_META } from "../body/meta";
import { ComponentDataEditor } from "../data-sources/ComponentDataEditor";
import { DataSourceLink } from "../data-sources/DataSourceLink";

/**
 * CHART body-component properties panel.
 *
 * Three tabs:
 *   - Layout: shared `BodyLayoutSection`.
 *   - Config: chart type picker, title styling, options, categories, series.
 *   - Data:   per-component data editor + central-data binding + randomize.
 *
 * Series editing is a clickable-row accordion — only one series row is open
 * at a time (`expandedSeries`). Adding a series also auto-extends the
 * component datasource with a dummy column so the new series renders with
 * something the moment the user creates it.
 */
export function ChartPropsPanel({
  comp,
  onUpdate,
  onDelete,
  onDuplicate,
  centralData,
  onUpdateCentralData,
  componentDataSources,
  onUpdateComponentDataSources,
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
  const m = BODY_COMP_META.CHART;
  const series = comp.chartSeries || [{ label: "Series A", dataKey: "value", color: "#2563eb" }];
  const updateSeries = (i: number, k: string, v: any) => {
    const s = [...series];
    s[i] = { ...s[i], [k]: v };
    up("chartSeries", s);
  };

  const [expandedSeries, setExpandedSeries] = useState<number | null>(null);

  const addSeries = () => {
    const newSeriesIndex = series.length + 1;
    const newDataKey = "value" + newSeriesIndex;
    const newLabel = `Series ${String.fromCharCode(64 + newSeriesIndex)}`;
    const newColor = ["#059669", "#dc2626", "#d97706", "#7c3aed"][series.length % 4];

    up("chartSeries", [...series, { label: newLabel, dataKey: newDataKey, color: newColor }]);

    if (onUpdateComponentDataSources && componentDataSources) {
      const currentData = componentDataSources[comp._id] || [];
      if (currentData.length === 0) {
        const sampleData = [
          { category: "Jan", value: 45000, value2: 38000, value3: 42000, value4: 35000 },
          { category: "Feb", value: 52000, value2: 44000, value3: 48000, value4: 41000 },
          { category: "Mar", value: 48000, value2: 51000, value3: 45000, value4: 47000 },
          { category: "Apr", value: 61000, value2: 55000, value3: 58000, value4: 52000 },
          { category: "May", value: 58000, value2: 62000, value3: 56000, value4: 59000 },
          { category: "Jun", value: 67000, value2: 63000, value3: 65000, value4: 61000 },
        ];
        onUpdateComponentDataSources({ ...componentDataSources, [comp._id]: sampleData });
      } else {
        const updatedData = currentData.map((row) => ({
          ...row,
          [newDataKey]: Math.floor(Math.random() * 40000) + 30000,
        }));
        onUpdateComponentDataSources({ ...componentDataSources, [comp._id]: updatedData });
      }
    }

    setExpandedSeries(series.length);
  };

  const delSeries = (i: number) => {
    const deletedSeries = series[i];
    up(
      "chartSeries",
      series.filter((_, j) => j !== i),
    );

    if (onUpdateComponentDataSources && componentDataSources && deletedSeries) {
      const currentData = componentDataSources[comp._id] || [];
      if (currentData.length > 0) {
        const updatedData = currentData.map((row) => {
          const { [deletedSeries.dataKey]: _removed, ...rest } = row;
          return rest;
        });
        onUpdateComponentDataSources({ ...componentDataSources, [comp._id]: updatedData });
      }
    }
  };

  const categories =
    comp.chartCategories && comp.chartCategories.length > 0
      ? comp.chartCategories
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  const updateCategory = (i: number, v: string) => {
    const c = [...categories];
    c[i] = v;
    up("chartCategories", c);

    if (onUpdateComponentDataSources && componentDataSources) {
      const currentData = componentDataSources[comp._id] || [];
      if (currentData.length > i) {
        const updatedData = currentData.map((row, idx) =>
          idx === i ? { ...row, category: v } : row,
        );
        onUpdateComponentDataSources({ ...componentDataSources, [comp._id]: updatedData });
      }
    }
  };
  const addCategory = () => {
    const newCategory = `Item ${categories.length + 1}`;
    up("chartCategories", [...categories, newCategory]);

    if (onUpdateComponentDataSources && componentDataSources) {
      const currentData = componentDataSources[comp._id] || [];
      const newRow: any = { category: newCategory };
      series.forEach((s) => {
        newRow[s.dataKey] = Math.floor(Math.random() * 40000) + 30000;
      });
      onUpdateComponentDataSources({
        ...componentDataSources,
        [comp._id]: [...currentData, newRow],
      });
    }
  };
  const delCategory = (i: number) => {
    if (categories.length <= 1) return;
    up(
      "chartCategories",
      categories.filter((_, j) => j !== i),
    );
    if (onUpdateComponentDataSources && componentDataSources) {
      const currentData = componentDataSources[comp._id] || [];
      if (currentData.length > i) {
        const updatedData = currentData.filter((_, idx) => idx !== i);
        onUpdateComponentDataSources({ ...componentDataSources, [comp._id]: updatedData });
      }
    }
  };

  type ChartTab = "layout" | "config" | "data";
  const [activeTab, setActiveTab] = useState<ChartTab>("layout");

  const randomizeData = () => {
    if (!onUpdateComponentDataSources || !componentDataSources) return;
    const currentData = componentDataSources[comp._id] || [];
    if (currentData.length === 0) return;

    const randomizedData = currentData.map((row) => {
      const newRow: any = { ...row };
      series.forEach((s) => {
        newRow[s.dataKey] = Math.floor(Math.random() * 40000) + 30000;
      });
      return newRow;
    });

    onUpdateComponentDataSources({ ...componentDataSources, [comp._id]: randomizedData });
  };

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
            { id: "layout", label: "Layout", icon: <LayoutGrid size={10} />, color: "#0891b2" },
            { id: "config", label: "Config", icon: <Settings2 size={10} />, color: m.color },
            { id: "data", label: "Data", icon: <Database size={10} />, color: "#2563eb" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ChartTab)}
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

      {activeTab === "data" && (
        <>
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 9,
                color: T.label,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontWeight: 700,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Database size={9} />
                COMPONENT DATA
              </div>
              <button
                onClick={randomizeData}
                style={{
                  background: "#7c3aed",
                  color: "#fff",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 8,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#6d28d9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#7c3aed")}
                title="Randomize all data values"
              >
                <RefreshCw size={9} />
                Randomize
              </button>
            </div>
            <ComponentDataEditor
              compId={comp._id}
              data={componentDataSources?.[comp._id]}
              onChange={(rows) => {
                if (!onUpdateComponentDataSources) return;
                onUpdateComponentDataSources({ ...(componentDataSources || {}), [comp._id]: rows });
              }}
            />
          </div>

          <div
            style={{
              fontSize: 9,
              color: "#94a3b8",
              textAlign: "center",
              margin: "12px 0 10px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            — or bind to central data —
          </div>

          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 9,
                color: T.label,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 700,
              }}
            >
              <Database size={9} />
              CENTRAL DATA SOURCE
            </div>
            <DataSourceLink
              comp={comp}
              onUpdate={onUpdate}
              centralData={centralData}
              onUpdateCentralData={onUpdateCentralData}
            />
          </div>
        </>
      )}

      {activeTab === "config" && (
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
                fontWeight: 700,
              }}
            >
              <BarChart2 size={9} />
              CHART TYPE
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 6 }}
            >
              {(
                [
                  { v: "bar", l: "Bar", Ic: BarChart2 },
                  { v: "line", l: "Line", Ic: TrendingUp },
                  { v: "pie", l: "Pie", Ic: PieChart },
                  { v: "donut", l: "Donut", Ic: PieChart },
                ] as const
              ).map(({ v, l, Ic }) => (
                <button
                  key={v}
                  onClick={() => up("chartType", v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 8px",
                    borderRadius: 5,
                    cursor: "pointer",
                    border: `1px solid ${comp.chartType === v ? m.color : T.border}`,
                    background: comp.chartType === v ? m.color + "14" : T.bg2,
                    color: comp.chartType === v ? m.color : T.label,
                    fontWeight: 600,
                    fontSize: 9,
                  }}
                >
                  <Ic size={11} />
                  {l}
                </button>
              ))}
            </div>
            <ColorInput
              label="Background"
              value={comp.chartBg || "#ffffff"}
              onChange={(v) => up("chartBg", v)}
            />
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, marginBottom: 10 }}>
            <div
              style={{
                fontSize: 9,
                color: T.label,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 700,
              }}
            >
              <Type size={9} />
              CHART TITLE
            </div>
            <div style={{ marginBottom: 7 }}>
              <Input
                value={comp.chartTitle || ""}
                onChange={(v) => up("chartTitle", v)}
                placeholder="Type a title…"
              />
            </div>

            <div style={{ display: "flex", gap: 4, marginBottom: 7, alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  gap: 2,
                  background: T.bg2,
                  padding: 2,
                  borderRadius: 5,
                  border: `1px solid ${T.border}`,
                }}
              >
                <button
                  onClick={() => up("chartTitleBold", !(comp.chartTitleBold ?? true))}
                  title="Bold"
                  style={{
                    width: 22,
                    height: 20,
                    padding: 0,
                    background: (comp.chartTitleBold ?? true) ? "#0ea5e9" : "transparent",
                    color: (comp.chartTitleBold ?? true) ? "#fff" : T.label,
                    border: "none",
                    borderRadius: 3,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bold size={11} />
                </button>
                <button
                  onClick={() => up("chartTitleItalic", !(comp.chartTitleItalic ?? false))}
                  title="Italic"
                  style={{
                    width: 22,
                    height: 20,
                    padding: 0,
                    background: (comp.chartTitleItalic ?? false) ? "#0ea5e9" : "transparent",
                    color: (comp.chartTitleItalic ?? false) ? "#fff" : T.label,
                    border: "none",
                    borderRadius: 3,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Italic size={11} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 2,
                  background: T.bg2,
                  padding: 2,
                  borderRadius: 5,
                  border: `1px solid ${T.border}`,
                }}
              >
                {(["left", "center", "right"] as const).map((a) => {
                  const active = (comp.chartTitleAlign ?? "center") === a;
                  const Ic = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                  return (
                    <button
                      key={a}
                      onClick={() => up("chartTitleAlign", a)}
                      title={`Align ${a}`}
                      style={{
                        width: 22,
                        height: 20,
                        padding: 0,
                        background: active ? "#0ea5e9" : "transparent",
                        color: active ? "#fff" : T.label,
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ic size={11} />
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: "auto" }}>
                <span style={{ fontSize: 9, color: T.muted }}>Size</span>
                <input
                  type="number"
                  min={6}
                  max={48}
                  value={comp.chartTitleFontSize ?? 12}
                  onChange={(e) =>
                    up(
                      "chartTitleFontSize",
                      Math.max(6, Math.min(48, parseInt(e.target.value) || 12)),
                    )
                  }
                  style={{
                    width: 40,
                    height: 22,
                    padding: "0 4px",
                    fontSize: 10,
                    textAlign: "center" as const,
                    background: T.bg2,
                    border: `1px solid ${T.border}`,
                    borderRadius: 4,
                    color: T.text,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <ColorInput
              label="Color"
              value={comp.chartTitleColor ?? "#1e293b"}
              onChange={(v) => up("chartTitleColor", v)}
            />
          </div>

          <PropSection
            label="Options"
            color="#64748b"
            icon={<Settings2 size={9} />}
            defaultOpen={false}
          >
            <Toggle
              label="Show Legend"
              value={!!comp.chartShowLegend}
              onChange={(v) => up("chartShowLegend", v)}
            />
            {(comp.chartType === "bar" || comp.chartType === "line" || !comp.chartType) && (
              <>
                <Toggle
                  label="Show Grid"
                  value={!!comp.chartShowGrid}
                  onChange={(v) => up("chartShowGrid", v)}
                />
                <Toggle
                  label="Show Scale"
                  value={!!comp.chartShowScale}
                  onChange={(v) => up("chartShowScale", v)}
                />
              </>
            )}
            <Toggle
              label="Show Values"
              value={!!comp.chartShowValues}
              onChange={(v) => up("chartShowValues", v)}
            />
            <PropRow label="Label Key">
              <Input
                value={comp.chartLabelKey || "label"}
                onChange={(v) => up("chartLabelKey", v)}
                placeholder="label"
              />
            </PropRow>
          </PropSection>

          <PropSection
            label="Categories"
            color="#d97706"
            icon={<List size={9} />}
            onAdd={addCategory}
            addLabel="Category"
            defaultOpen={false}
          >
            <div style={{ fontSize: 9, color: T.muted, marginBottom: 6, lineHeight: 1.4 }}>
              X-axis labels for bar / line charts (slice labels for pie / donut).
            </div>
            {categories.map((cat, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}
              >
                <span style={{ fontSize: 9, color: T.muted, minWidth: 14, textAlign: "right" }}>
                  {i + 1}.
                </span>
                <div style={{ flex: 1 }}>
                  <Input
                    value={cat}
                    onChange={(v) => updateCategory(i, v)}
                    placeholder={`Category ${i + 1}`}
                  />
                </div>
                {categories.length > 1 && (
                  <button
                    onClick={() => delCategory(i)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                      display: "flex",
                      padding: 2,
                    }}
                    title="Remove category"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </PropSection>

          <PropSection
            label="Series"
            color="#2563eb"
            icon={<List size={9} />}
            onAdd={() => {
              addSeries();
              setExpandedSeries(series.length);
            }}
            addLabel="Series"
            defaultOpen={true}
          >
            {series.map((s, i) => {
              const isOpen = expandedSeries === i;
              return (
                <div
                  key={i}
                  style={{
                    background: isOpen ? T.bg2 : "#fff",
                    border: `1px solid ${isOpen ? s.color + "55" : T.border}`,
                    borderRadius: 6,
                    marginBottom: 4,
                    overflow: "hidden",
                    transition: "background .15s,border-color .15s",
                  }}
                >
                  <div
                    onClick={() => setExpandedSeries(isOpen ? null : i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "6px 8px",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isOpen) e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      if (!isOpen) e.currentTarget.style.background = "";
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: s.color,
                        flexShrink: 0,
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: T.text,
                        flex: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.label || `Series ${i + 1}`}
                    </span>
                    <span
                      style={{
                        fontSize: 8,
                        fontFamily: "monospace",
                        color: T.muted,
                        background: "#f1f5f9",
                        borderRadius: 3,
                        padding: "1px 5px",
                        maxWidth: 70,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.dataKey}
                    </span>
                    <ChevronDown
                      size={11}
                      style={{
                        color: T.muted,
                        transform: isOpen ? "rotate(180deg)" : undefined,
                        transition: "transform .15s",
                        flexShrink: 0,
                      }}
                    />
                    {series.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          delSeries(i);
                          if (isOpen) setExpandedSeries(null);
                        }}
                        title="Delete series"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          display: "flex",
                          padding: 2,
                          borderRadius: 3,
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>

                  {isOpen && (
                    <div style={{ padding: "4px 8px 8px", borderTop: `1px solid ${T.border}` }}>
                      <div style={{ marginBottom: 6, marginTop: 4 }}>
                        <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Label</div>
                        <Input
                          value={s.label}
                          onChange={(v) => updateSeries(i, "label", v)}
                          placeholder="Series name"
                        />
                      </div>
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Data Key</div>
                        <input
                          value={s.dataKey}
                          onChange={(e) => updateSeries(i, "dataKey", e.target.value)}
                          style={{ ...inputStyle, fontFamily: "monospace" }}
                          placeholder="column_key"
                        />
                      </div>
                      <ColorInput
                        label="Color"
                        value={s.color}
                        onChange={(v) => updateSeries(i, "color", v)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </PropSection>
        </>
      )}

      {activeTab === "layout" && <BodyLayoutSection comp={comp} onUpdate={onUpdate} />}
    </div>
  );
}
