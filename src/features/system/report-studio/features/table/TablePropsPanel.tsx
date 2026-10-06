import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Columns3,
  Database,
  FileJson,
  GripVertical,
  LayoutGrid,
  Link,
  Maximize2,
  Palette,
  Plus,
  Table2,
  Trash2,
} from "lucide-react";
import type { BodyComponent } from "../../types/body";
import type { Column, TableStyle } from "../../types/table";
import { T } from "../../theme/tokens";
import { inputStyle } from "../../theme/inputStyle";
import { deepClone } from "../../utils/deepClone";
import { uid } from "../../utils/id";
import { headerToDataKey } from "../../utils/string";
import { PropSection } from "../../components/layout/PropSection";
import { PropGrid2 } from "../../components/layout/PropGrid2";
import { PropCell } from "../../components/layout/PropCell";
import { Select } from "../../components/form/Select";
import { ColorInput } from "../../components/form/ColorInput";
import { SpacingInput } from "../../components/form/SpacingInput";
import { Toggle } from "../../components/common/Toggle";
import { BodyCompHeader } from "../body/BodyCompHeader";
import { BodyLayoutSection } from "../body/BodyLayoutSection";
import { BODY_COMP_META } from "../body/meta";
import { ComponentDataEditor } from "../data-sources/ComponentDataEditor";
import { DataSourceLink } from "../data-sources/DataSourceLink";
import { ColumnPropsPanel } from "./ColumnPropsPanel";
import { DataRowsEditor } from "./DataRowsEditor";

/**
 * Factory for a fresh `Column`. Hoisted from the monolith (1121); inlined
 * here because TablePropsPanel is its only caller in the refactored tree.
 */
function createColumn(header: string, ov: Partial<Column> = {}): Column {
  return {
    _id: uid(),
    header,
    dataKey: headerToDataKey(header),
    headerPreset: "header",
    dataPreset: "normal",
    align: "LEFT",
    width: 2,
    format: null,
    ...ov,
  };
}

/**
 * TABLE body-component properties panel.
 *
 * Four tabs: Columns, Data, Style, Layout.
 *
 * Column reorder uses the same `colsRef + updColsRef` pattern as
 * `ColumnListPanel` because the `mousemove` listener spans renders. The
 * panel embeds the full `ColumnPropsPanel` inline when a row is selected,
 * so the user can edit a column without leaving the Columns tab.
 *
 * The Data tab is a giant inline block — preserved as-is from the monolith
 * because it owns several conditional sub-panels (list / database / api)
 * whose visibility is driven by `comp.tableDataType`.
 */
export function TablePropsPanel({
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
  const m = BODY_COMP_META.TABLE;
  type TTab = "columns" | "data" | "style" | "layout";
  const [activeTab, setActiveTab] = useState<TTab>("columns");
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [selColId, setSelColId] = useState<string | null>(null);
  const colListRef = useRef<HTMLDivElement>(null);

  const cols: Column[] = comp.tableColumns ?? [];
  const ts: TableStyle = comp.tableStyle ?? {
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    borderStyle: "solid",
    horizontalBorderOnly: false,
    verticalBorderOnly: false,
    headerBorder: true,
    headerColor: "#1e40af",
    dataBorder: true,
    consistentCellAlignment: false,
    cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
  };
  const odd = comp.tableOddRowBg ?? "#f8fafc";

  const updCols = (next: Column[]) => onUpdate({ ...comp, tableColumns: next });
  const updTs = (next: TableStyle) => onUpdate({ ...comp, tableStyle: next });
  const updOdd = (v: string) => onUpdate({ ...comp, tableOddRowBg: v });
  const updCol = (upd: Column) => updCols(cols.map(c => (c._id === upd._id ? upd : c)));
  const delCol = (id: string) => {
    updCols(cols.filter(c => c._id !== id));
    if (selColId === id) setSelColId(null);
  };

  const colsRef = useRef(cols);
  colsRef.current = cols;
  const updColsRef = useRef(updCols);
  updColsRef.current = updCols;

  const onColGripMouseDown = (e: React.MouseEvent, startIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const list = colListRef.current;
    if (!list) return;
    const itemEls = Array.from(list.querySelectorAll<HTMLElement>("[data-table-col-idx]"));
    let toIdx = startIdx;
    let toPos: "top" | "bottom" = "bottom";
    const draggedEl = itemEls[startIdx];
    if (draggedEl) draggedEl.style.opacity = "0.35";
    const clearInds = () =>
      itemEls.forEach(el => {
        el.style.borderTopColor = "";
        el.style.borderTopWidth = "";
        el.style.borderBottomColor = "";
        el.style.borderBottomWidth = "";
      });
    const onMove = (me: MouseEvent) => {
      clearInds();
      for (let i = 0; i < itemEls.length; i++) {
        const r = itemEls[i].getBoundingClientRect();
        if (me.clientY >= r.top && me.clientY <= r.bottom) {
          toIdx = i;
          toPos = me.clientY < r.top + r.height / 2 ? "top" : "bottom";
          if (toPos === "top") {
            itemEls[i].style.borderTopColor = m.color;
            itemEls[i].style.borderTopWidth = "2px";
          } else {
            itemEls[i].style.borderBottomColor = m.color;
            itemEls[i].style.borderBottomWidth = "2px";
          }
          break;
        }
      }
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      clearInds();
      if (draggedEl) draggedEl.style.opacity = "";
      if (startIdx === toIdx) return;
      const arr = deepClone(colsRef.current);
      const [moved] = arr.splice(startIdx, 1);
      const adj = startIdx < toIdx ? toIdx - 1 : toIdx;
      let at = toPos === "top" ? adj : adj + 1;
      at = Math.max(0, Math.min(arr.length, at));
      arr.splice(at, 0, moved);
      updColsRef.current(arr);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const commitNewCol = () => {
    const col = createColumn(newColName.trim() || "Column");
    updCols([...cols, col]);
    setSelColId(col._id);
    setIsAddingCol(false);
    setNewColName("");
  };

  const selCol = cols.find(c => c._id === selColId) ?? null;

  const TABS: { id: TTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "columns", label: "Columns", icon: <Columns3 size={11} />, color: m.color },
    { id: "data",    label: "Data",    icon: <Database size={11} />, color: "#059669" },
    { id: "style",   label: "Style",   icon: <Table2 size={11} />,   color: "#d97706" },
    { id: "layout",  label: "Layout",  icon: <LayoutGrid size={11} />, color: "#0891b2" },
  ];

  return (
    <div style={{ fontSize: 11 }}>
      <BodyCompHeader comp={comp} onUpdate={onUpdate} onDelete={onDelete} onDuplicate={onDuplicate} color={m.color} Icon={m.Icon} />

      <div
        style={{
          display: "flex", background: T.bg2,
          borderRadius: 8, padding: 3, gap: 2,
          marginBottom: 10, border: `1px solid ${T.border}`,
        }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                padding: "5px 4px", borderRadius: 6,
                border: "none", cursor: "pointer",
                fontSize: 9.5, fontWeight: 700,
                background: isActive ? "#fff" : "transparent",
                color: isActive ? tab.color : T.muted,
                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,.1)" : "none",
                transition: "all .15s",
              }}
            >
              <span style={{ color: isActive ? tab.color : T.muted, display: "flex" }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "columns" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <button
              onClick={() => setIsAddingCol(true)}
              style={{
                background: m.color, color: "#fff", border: "none",
                padding: "4px 12px", borderRadius: 5, cursor: "pointer",
                fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <Plus size={11} />
              Add Column
            </button>
          </div>

          {isAddingCol && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 7, padding: "8px 10px", marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#92400e", marginBottom: 5 }}>New Column</div>
              <input
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                placeholder="Column header…"
                onKeyDown={e => {
                  if (e.key === "Enter") commitNewCol();
                  if (e.key === "Escape") {
                    setIsAddingCol(false);
                    setNewColName("");
                  }
                }}
                autoFocus
                style={{ ...inputStyle, marginBottom: 6 }}
              />
              <div style={{ display: "flex", gap: 5 }}>
                <button
                  onClick={commitNewCol}
                  style={{
                    flex: 1, background: m.color, color: "#fff", border: "none",
                    padding: "4px 0", borderRadius: 5, cursor: "pointer",
                    fontSize: 10, fontWeight: 700,
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => { setIsAddingCol(false); setNewColName(""); }}
                  style={{
                    padding: "4px 10px", background: T.bg,
                    border: `1px solid ${T.border}`, borderRadius: 5,
                    cursor: "pointer", fontSize: 9, color: T.muted,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {cols.length === 0 && !isAddingCol && (
            <div style={{ textAlign: "center", padding: "20px 0", color: T.muted, fontSize: 10 }}>
              <Columns3 size={18} style={{ display: "block", margin: "0 auto 6px", opacity: 0.3 }} />
              No columns yet — click Add Column
            </div>
          )}

          <div ref={colListRef}>
            {cols.map((col, idx) => {
              const isSel = selColId === col._id;
              const canUp = idx > 0;
              const canDown = idx < cols.length - 1;
              const moveCol = (from: number, to: number) => {
                const arr = deepClone(cols);
                const [moved] = arr.splice(from, 1);
                arr.splice(to, 0, moved);
                updCols(arr);
              };
              return (
                <div key={col._id}>
                  <div
                    data-table-col-idx={idx}
                    onClick={() => setSelColId(isSel ? null : col._id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 8px", marginBottom: 2,
                      borderRadius: 6, cursor: "pointer", userSelect: "none",
                      background: isSel ? m.color + "12" : "#fff",
                      border: `1px solid ${isSel ? m.color + "55" : "#e2e8f0"}`,
                      boxShadow: isSel ? `0 0 0 1px ${m.color}22` : "none",
                    }}
                  >
                    <div
                      onMouseDown={e => onColGripMouseDown(e, idx)}
                      onClick={e => e.stopPropagation()}
                      style={{
                        cursor: "grab", flexShrink: 0,
                        display: "flex", color: T.muted, padding: "0 1px",
                      }}
                      title="Drag to reorder"
                    >
                      <GripVertical size={12} />
                    </div>
                    <div
                      style={{
                        width: 16, height: 16, borderRadius: 4,
                        background: isSel ? m.color : "#e2e8f0",
                        color: isSel ? "#fff" : T.muted,
                        fontSize: 8, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <span
                      style={{
                        flex: 1, fontSize: 10,
                        fontWeight: isSel ? 700 : 500,
                        color: isSel ? m.color : T.text,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    >
                      {col.header}
                    </span>
                    <span style={{ fontSize: 8, color: T.muted, fontFamily: "monospace", flexShrink: 0 }}>
                      {col.width}×
                    </span>
                    <div
                      style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => moveCol(idx, idx - 1)}
                        disabled={!canUp}
                        title="Move up"
                        style={{
                          background: "none", border: "none",
                          padding: "1px 2px",
                          cursor: canUp ? "pointer" : "default",
                          color: canUp ? T.label : T.border,
                          display: "flex", lineHeight: 1,
                        }}
                      >
                        <ChevronUp size={9} />
                      </button>
                      <button
                        onClick={() => moveCol(idx, idx + 1)}
                        disabled={!canDown}
                        title="Move down"
                        style={{
                          background: "none", border: "none",
                          padding: "1px 2px",
                          cursor: canDown ? "pointer" : "default",
                          color: canDown ? T.label : T.border,
                          display: "flex", lineHeight: 1,
                        }}
                      >
                        <ChevronDown size={9} />
                      </button>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); delCol(col._id); }}
                      title="Delete column"
                      style={{
                        background: "none", border: "none", color: "#fca5a5",
                        cursor: "pointer", padding: 2,
                        display: "flex", flexShrink: 0,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#fca5a5")}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>

                  {isSel && selCol && (
                    <div
                      style={{
                        background: T.bg2, border: `1px solid ${m.color}33`,
                        borderRadius: 8, padding: "8px 8px 4px",
                        marginBottom: 6, marginTop: -1,
                      }}
                    >
                      <ColumnPropsPanel col={selCol} onUpdate={updCol} onDelete={() => delCol(col._id)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "data" &&
        (() => {
          const dataType = comp.tableDataType ?? "list";
          const upD = (k: string, v: any) => onUpdate({ ...comp, [k]: v });

          return (
            <div>
              <PropSection label="Component Data" color="#2563eb" icon={<Database size={9} />}>
                <ComponentDataEditor
                  compId={comp._id}
                  data={componentDataSources?.[comp._id]}
                  onChange={rows => {
                    if (!onUpdateComponentDataSources) return;
                    onUpdateComponentDataSources({ ...(componentDataSources || {}), [comp._id]: rows });
                  }}
                />
              </PropSection>

              <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", margin: "8px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                — or bind to central data —
              </div>

              <PropSection label="Central Data Source" color="#7c3aed" icon={<Database size={9} />}>
                <DataSourceLink comp={comp} onUpdate={onUpdate} centralData={centralData} onUpdateCentralData={onUpdateCentralData} />
              </PropSection>

              <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", margin: "8px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                — or use embedded data (legacy) —
              </div>

              <PropSection label="Source Type" color="#059669" icon={<Database size={9} />}>
                <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                  {(["list", "database", "api"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => upD("tableDataType", t)}
                      style={{
                        flex: 1, padding: "5px 0", borderRadius: 6,
                        border: `1.5px solid ${dataType === t ? "#059669" : "#e2e8f0"}`,
                        background: dataType === t ? "#ecfdf5" : "#fff",
                        color: dataType === t ? "#059669" : "#64748b",
                        cursor: "pointer", fontSize: 9.5, fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </PropSection>

              {dataType === "list" && (
                <PropSection label="Inline Data (JSON)" color="#059669" icon={<FileJson size={9} />}>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 5, lineHeight: 1.5 }}>
                    Enter an array of row objects. Keys must match column <strong>dataKey</strong> values.
                  </div>
                  <DataRowsEditor
                    rows={comp.tableDataRows ?? []}
                    columns={comp.tableColumns ?? []}
                    onChange={rows => upD("tableDataRows", rows)}
                  />
                </PropSection>
              )}

              {dataType === "database" && (
                <PropSection label="Database Query" color="#059669" icon={<Database size={9} />}>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 5 }}>
                    SQL query or datasource query string. Use{" "}
                    <code style={{ background: "#f1f5f9", padding: "0 3px", borderRadius: 3 }}>:param</code>{" "}
                    for parameters.
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Query</div>
                    <textarea
                      value={comp.tableDbQuery ?? ""}
                      onChange={e => upD("tableDbQuery", e.target.value)}
                      placeholder={"SELECT * FROM employees\nWHERE department = :dept"}
                      rows={5}
                      style={{
                        width: "100%",
                        fontFamily: "'Fira Code','Courier New',monospace", fontSize: 10,
                        border: `1px solid ${T.border}`, borderRadius: 6,
                        padding: "8px 10px", resize: "vertical", outline: "none",
                        boxSizing: "border-box",
                        background: T.bg2, color: T.text,
                      }}
                    />
                  </div>
                </PropSection>
              )}

              {dataType === "api" && (
                <PropSection label="API Endpoint" color="#059669" icon={<Link size={9} />}>
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>URL</div>
                    <input
                      value={comp.tableApiUrl ?? ""}
                      onChange={e => upD("tableApiUrl", e.target.value)}
                      placeholder="https://api.example.com/data"
                      style={{ ...inputStyle, fontFamily: "monospace", fontSize: 10 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                    {(["GET", "POST"] as const).map(m2 => (
                      <button
                        key={m2}
                        onClick={() => upD("tableApiMethod", m2)}
                        style={{
                          flex: 1, padding: "4px 0", borderRadius: 5,
                          border: `1.5px solid ${(comp.tableApiMethod ?? "GET") === m2 ? "#059669" : T.border}`,
                          background: (comp.tableApiMethod ?? "GET") === m2 ? "rgba(5, 150, 105, 0.15)" : T.bg,
                          color: (comp.tableApiMethod ?? "GET") === m2 ? "#10b981" : T.muted,
                          cursor: "pointer", fontSize: 9.5, fontWeight: 700,
                        }}
                      >
                        {m2}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>
                      Headers <span style={{ color: T.muted }}>(JSON)</span>
                    </div>
                    <textarea
                      value={comp.tableApiHeaders ?? ""}
                      onChange={e => upD("tableApiHeaders", e.target.value)}
                      placeholder={'{"Authorization": "Bearer token"}'}
                      rows={3}
                      style={{
                        width: "100%",
                        fontFamily: "'Fira Code','Courier New',monospace", fontSize: 10,
                        border: `1px solid ${T.border}`, borderRadius: 6,
                        padding: "6px 8px", resize: "vertical", outline: "none",
                        boxSizing: "border-box",
                        background: T.bg2, color: T.text,
                      }}
                    />
                  </div>
                  {(comp.tableApiMethod ?? "GET") === "POST" && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>
                        Request Body <span style={{ color: T.muted }}>(JSON)</span>
                      </div>
                      <textarea
                        value={comp.tableApiBody ?? ""}
                        onChange={e => upD("tableApiBody", e.target.value)}
                        placeholder={'{"filter": "active"}'}
                        rows={3}
                        style={{
                          width: "100%",
                          fontFamily: "'Fira Code','Courier New',monospace", fontSize: 10,
                          border: `1px solid ${T.border}`, borderRadius: 6,
                          padding: "6px 8px", resize: "vertical", outline: "none",
                          boxSizing: "border-box",
                          background: T.bg2, color: T.text,
                        }}
                      />
                    </div>
                  )}
                </PropSection>
              )}

              {dataType === "list" && (
                <div style={{ fontSize: 9, color: T.muted, textAlign: "center", marginTop: 4 }}>
                  {(comp.tableDataRows ?? []).length} row{(comp.tableDataRows ?? []).length !== 1 ? "s" : ""} · previewed in canvas
                </div>
              )}
            </div>
          );
        })()}

      {activeTab === "style" && (
        <div>
          <PropSection label="Colors" color="#d97706" icon={<Palette size={9} />}>
            <ColorInput label="Header Color" value={ts.headerColor} onChange={v => updTs({ ...ts, headerColor: v })} />
            <ColorInput label="Border Color" value={ts.borderColor} onChange={v => updTs({ ...ts, borderColor: v })} />
            <ColorInput label="Odd Row Bg" value={odd} onChange={updOdd} />
          </PropSection>

          <PropSection label="Borders" color="#d97706" icon={<Table2 size={9} />}>
            <PropGrid2>
              <PropCell label="Border W" value={ts.borderWidth} onChange={v => updTs({ ...ts, borderWidth: +v })} step={0.1} min={0} />
              <div>
                <div style={{ fontSize: 9, color: T.label, marginBottom: 2 }}>Style</div>
                <Select value={ts.borderStyle} onChange={v => updTs({ ...ts, borderStyle: v })} options={["solid", "dashed", "dotted"]} />
              </div>
            </PropGrid2>
            <Toggle label="Horizontal borders only" value={ts.horizontalBorderOnly} onChange={v => updTs({ ...ts, horizontalBorderOnly: v })} />
            <Toggle label="Data row borders" value={ts.dataBorder} onChange={v => updTs({ ...ts, dataBorder: v })} />
            <Toggle label="Header border" value={ts.headerBorder} onChange={v => updTs({ ...ts, headerBorder: v })} />
          </PropSection>

          <PropSection label="Cell Padding" color="#059669" icon={<Maximize2 size={9} />}>
            <SpacingInput label="Cell Padding" value={ts.cellPadding} onChange={v => updTs({ ...ts, cellPadding: v })} />
          </PropSection>
        </div>
      )}

      {activeTab === "layout" && <BodyLayoutSection comp={comp} onUpdate={onUpdate} />}
    </div>
  );
}
