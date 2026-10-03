import { useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  LayoutGrid,
  Lock,
  Plus,
  Trash2,
  Unlock,
} from "lucide-react";
import type { BodyComponent, BodyCompType, BodyRow } from "../../types/body";
import { T } from "../../theme/tokens";
import { BODY_COMP_META } from "./meta";

/**
 * Left-rail body layout panel. Manages rows + slots + components with full
 * drag-and-drop:
 *
 *   - Drag a row (header strip) to reorder rows.
 *   - Drag a component card into a different slot to move it across rows.
 *   - Empty slots show a "+ Add" prompt that opens a type picker modal.
 *
 * Empty state shows a quick-start grid (1 / 2 / 3 / 4 column rows).
 */
export function BodyComponentListPanel({
  rows,
  comps,
  selId,
  selRowId,
  onSelRow,
  onSelComp,
  onAddRow,
  onAddComp,
  onMoveComp,
  onDeleteRow,
  onDeleteComp,
  onToggleHidden,
  onToggleLocked,
  onToggleRowHidden,
  onToggleRowLocked,
  onDuplicate,
  onReorderRows,
}: {
  rows: BodyRow[];
  comps: BodyComponent[];
  selId: string | null;
  selRowId: string | null;
  onSelRow: (id: string) => void;
  onSelComp: (id: string) => void;
  onAddRow: (cols: number) => void;
  onAddComp: (type: BodyCompType, rowId: string, slot: number) => void;
  onMoveComp: (compId: string, targetRowId: string, targetSlot: number) => void;
  onDeleteRow: (id: string) => void;
  onDeleteComp: (id: string) => void;
  onUpdateRow: (r: BodyRow) => void;
  onUpdateComp: (c: BodyComponent) => void;
  onToggleHidden: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onToggleRowHidden: (id: string) => void;
  onToggleRowLocked: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReorderRows: (rows: BodyRow[]) => void;
}) {
  const [addRowCols, setAddRowCols] = useState(1);
  const [addRowOpen, setAddRowOpen] = useState(false);
  const [addCompTarget, setAddCompTarget] = useState<{ rowId: string; slot: number } | null>(null);
  const [dragCompId, setDragCompId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ rowId: string; slot: number } | null>(null);
  const [dragRowId, setDragRowId] = useState<string | null>(null);
  const [dragRowOverId, setDragRowOverId] = useState<string | null>(null);

  const getSlotComp = (rowId: string, slot: number) =>
    comps.find(c => c.rowId === rowId && c.slotIndex === slot && !c.freePosition);

  const COMP_TYPES: BodyCompType[] = ["TABLE", "CHART", "IMAGE", "TEXT_BLOCK"];

  const confirmAddComp = (type: BodyCompType) => {
    if (!addCompTarget) return;
    onAddComp(type, addCompTarget.rowId, addCompTarget.slot);
    setAddCompTarget(null);
  };

  const handleCompDragStart = (e: React.DragEvent, compId: string) => {
    e.dataTransfer.effectAllowed = "move";
    setDragCompId(compId);
  };
  const handleSlotDragOver = (e: React.DragEvent, rowId: string, slot: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlot({ rowId, slot });
  };
  const handleSlotDrop = (_e: React.DragEvent, rowId: string, slot: number) => {
    _e.preventDefault();
    if (dragCompId) onMoveComp(dragCompId, rowId, slot);
    setDragCompId(null);
    setDragOverSlot(null);
  };

  const handleRowDragStart = (e: React.DragEvent, rowId: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    setDragRowId(rowId);
  };
  const handleRowDragOver = (e: React.DragEvent, rowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragRowOverId(rowId);
  };
  const handleRowDrop = (e: React.DragEvent, targetRowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragRowId || dragRowId === targetRowId) {
      setDragRowId(null);
      setDragRowOverId(null);
      return;
    }
    const arr = [...rows];
    const fi = arr.findIndex(r => r._id === dragRowId);
    const ti = arr.findIndex(r => r._id === targetRowId);
    if (fi < 0 || ti < 0) return;
    const [m] = arr.splice(fi, 1);
    arr.splice(ti, 0, m);
    onReorderRows(arr);
    setDragRowId(null);
    setDragRowOverId(null);
  };

  const ROW_COLOR = "#059669";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: T.label, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Body Layout
        </span>
        <button
          onClick={() => setAddRowOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "#ecfdf5", border: "1px solid #a7f3d0",
            color: ROW_COLOR, borderRadius: 5, padding: "3px 9px",
            cursor: "pointer", fontSize: 9, fontWeight: 700,
          }}
        >
          <Plus size={10} />
          Add Row
        </button>
      </div>

      {addRowOpen && (
        <div style={{ background: T.bg2, border: `1px solid #a7f3d0`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: ROW_COLOR, marginBottom: 6 }}>
            New Row — columns (slots):
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, marginBottom: 8 }}>
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setAddRowCols(n)}
                style={{
                  padding: "8px 4px", borderRadius: 6,
                  cursor: "pointer", fontWeight: 700, fontSize: 11,
                  border: `2px solid ${addRowCols === n ? ROW_COLOR : T.border}`,
                  background: addRowCols === n ? ROW_COLOR + "14" : T.bg,
                  color: addRowCols === n ? ROW_COLOR : T.muted,
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 3, marginBottom: 8, height: 24 }}>
            {Array.from({ length: addRowCols }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1, background: ROW_COLOR + "22",
                  border: `1px solid ${ROW_COLOR}44`,
                  borderRadius: 3,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 7.5, color: ROW_COLOR, fontWeight: 700,
                }}
              >
                Col {i + 1}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <button
              onClick={() => { onAddRow(addRowCols); setAddRowOpen(false); }}
              style={{
                flex: 1, padding: "5px 0",
                background: ROW_COLOR, color: "#fff", border: "none",
                borderRadius: 5, cursor: "pointer",
                fontSize: 10, fontWeight: 700,
              }}
            >
              Create Row ↵
            </button>
            <button
              onClick={() => setAddRowOpen(false)}
              style={{
                padding: "5px 10px", background: T.bg,
                border: `1px solid ${T.border}`, borderRadius: 5,
                cursor: "pointer", fontSize: 9, color: T.muted,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {addCompTarget && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
            zIndex: 500,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setAddCompTarget(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: T.bg, borderRadius: 12,
              padding: 18, minWidth: 260,
              boxShadow: "0 12px 40px rgba(0,0,0,.3)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 12 }}>
              Add component to slot {addCompTarget.slot + 1}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {COMP_TYPES.map(type => {
                const m = BODY_COMP_META[type];
                const Icon = m.Icon;
                return (
                  <button
                    key={type}
                    onClick={() => confirmAddComp(type)}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "10px 10px", borderRadius: 8,
                      cursor: "pointer",
                      background: m.color + "10",
                      border: `1.5px solid ${m.color}44`,
                      color: m.color, fontWeight: 700, fontSize: 10,
                    }}
                  >
                    <Icon size={15} />
                    {m.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setAddCompTarget(null)}
              style={{
                width: "100%", marginTop: 10,
                padding: "6px 0", background: "none",
                border: `1px solid ${T.border}`, borderRadius: 6,
                color: T.muted, cursor: "pointer", fontSize: 9,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px 8px", background: T.bg2, borderRadius: 8, border: `1.5px dashed ${T.border}`, marginBottom: 8 }}>
          <LayoutGrid size={22} color={T.border} style={{ display: "block", margin: "0 auto 8px" }} />
          <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.6 }}>
            No rows yet.
            <br />
            Click <strong style={{ color: ROW_COLOR }}>Add Row</strong> to create a layout row,
            <br />
            then add components into its column slots.
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map(row => {
          const isRowSel = selRowId === row._id;
          const isDragOver = dragRowOverId === row._id;

          return (
            <div
              key={row._id}
              draggable
              onDragStart={e => handleRowDragStart(e, row._id)}
              onDragOver={e => handleRowDragOver(e, row._id)}
              onDragLeave={() => setDragRowOverId(null)}
              onDrop={e => handleRowDrop(e, row._id)}
              style={{
                borderRadius: 8,
                border: `2px solid ${isRowSel ? ROW_COLOR : isDragOver ? "#34d399" : T.border}`,
                background: isRowSel ? ROW_COLOR + "07" : isDragOver ? "#ecfdf5" : "#f8fafc",
                transition: "all .12s", cursor: "grab",
              }}
            >
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 8px",
                  borderBottom: `1px solid ${isRowSel ? ROW_COLOR + "33" : T.border}`,
                  background: isRowSel ? ROW_COLOR + "10" : "transparent",
                  borderRadius: "6px 6px 0 0",
                }}
                onClick={() => onSelRow(row._id)}
              >
                <GripVertical size={10} color={T.muted} style={{ flexShrink: 0 }} />
                <LayoutGrid size={10} color={ROW_COLOR} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: 9, fontWeight: 700,
                    color: isRowSel ? ROW_COLOR : T.text,
                    flex: 1, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: 7.5, color: T.muted,
                    background: T.bg2, borderRadius: 3,
                    padding: "1px 5px", border: `1px solid ${T.border}`,
                  }}
                >
                  {row.cols} col{row.cols > 1 ? "s" : ""}
                </span>
                <button
                  title={row.hidden ? "Show row" : "Hide row"}
                  onClick={e => { e.stopPropagation(); onToggleRowHidden(row._id); }}
                  style={{
                    width: 16, height: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "none", border: "none",
                    color: row.hidden ? "#d97706" : T.muted,
                    cursor: "pointer", flexShrink: 0,
                  }}
                >
                  {row.hidden ? <EyeOff size={8} /> : <Eye size={8} />}
                </button>
                <button
                  title={row.locked ? "Unlock row" : "Lock row"}
                  onClick={e => { e.stopPropagation(); onToggleRowLocked(row._id); }}
                  style={{
                    width: 16, height: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "none", border: "none",
                    color: row.locked ? "#d97706" : T.muted,
                    cursor: "pointer", flexShrink: 0,
                  }}
                >
                  {row.locked ? <Lock size={8} /> : <Unlock size={8} />}
                </button>
                <button
                  title="Delete row"
                  onClick={e => { e.stopPropagation(); onDeleteRow(row._id); }}
                  style={{
                    width: 16, height: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "none", border: "none",
                    color: "#dc2626", cursor: "pointer", flexShrink: 0,
                  }}
                >
                  <Trash2 size={8} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: `repeat(${row.cols},1fr)`, gap: 4, padding: "6px 6px 6px" }}>
                {Array.from({ length: row.cols }).map((_, slot) => {
                  const comp = getSlotComp(row._id, slot);
                  const isSel = comp?._id === selId;
                  const isDrop = dragOverSlot?.rowId === row._id && dragOverSlot?.slot === slot;
                  const m = comp ? BODY_COMP_META[comp.type] : null;

                  return (
                    <div
                      key={slot}
                      onDragOver={e => handleSlotDragOver(e, row._id, slot)}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDrop={e => handleSlotDrop(e, row._id, slot)}
                      style={{
                        borderRadius: 6,
                        border: `1.5px dashed ${isDrop ? "#059669" : isSel && m ? m.color : T.border}`,
                        background: isDrop ? "#ecfdf5" : isSel && m ? m.color + "0c" : "#fff",
                        minHeight: 48, overflow: "hidden",
                        transition: "all .1s",
                      }}
                    >
                      {comp
                        ? (() => {
                            const mm = BODY_COMP_META[comp.type];
                            const Icon = mm.Icon;
                            return (
                              <div
                                draggable
                                onDragStart={e => handleCompDragStart(e, comp._id)}
                                onClick={() => onSelComp(comp._id)}
                                style={{ padding: "5px 6px", cursor: "grab", display: "flex", flexDirection: "column", gap: 2 }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <div
                                    style={{
                                      width: 16, height: 16, borderRadius: 3,
                                      background: mm.color + "20",
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      color: mm.color, flexShrink: 0,
                                    }}
                                  >
                                    <Icon size={9} />
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 8.5, fontWeight: 600,
                                      color: isSel ? mm.color : T.text,
                                      flex: 1, overflow: "hidden",
                                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}
                                  >
                                    {comp.label}
                                  </span>
                                </div>
                                <div style={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                                  <button
                                    title={comp.hidden ? "Show" : "Hide"}
                                    onClick={e => { e.stopPropagation(); onToggleHidden(comp._id); }}
                                    style={{
                                      width: 14, height: 14,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      background: "none", border: "none",
                                      color: comp.hidden ? "#d97706" : T.muted,
                                      cursor: "pointer", padding: 0,
                                    }}
                                  >
                                    {comp.hidden ? <EyeOff size={8} /> : <Eye size={8} />}
                                  </button>
                                  <button
                                    title={comp.locked ? "Unlock" : "Lock"}
                                    onClick={e => { e.stopPropagation(); onToggleLocked(comp._id); }}
                                    style={{
                                      width: 14, height: 14,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      background: "none", border: "none",
                                      color: comp.locked ? "#d97706" : T.muted,
                                      cursor: "pointer", padding: 0,
                                    }}
                                  >
                                    {comp.locked ? <Lock size={8} /> : <Unlock size={8} />}
                                  </button>
                                  <button
                                    title="Duplicate"
                                    onClick={e => { e.stopPropagation(); onDuplicate(comp._id); }}
                                    style={{
                                      width: 14, height: 14,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      background: "none", border: "none",
                                      color: "#0891b2", cursor: "pointer", padding: 0,
                                    }}
                                  >
                                    <Copy size={8} />
                                  </button>
                                  <button
                                    title="Remove from slot"
                                    onClick={e => { e.stopPropagation(); onDeleteComp(comp._id); }}
                                    style={{
                                      width: 14, height: 14,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      background: "none", border: "none",
                                      color: "#dc2626", cursor: "pointer", padding: 0,
                                    }}
                                  >
                                    <Trash2 size={8} />
                                  </button>
                                </div>
                              </div>
                            );
                          })()
                        : !row.locked && (
                            <div
                              onClick={() => setAddCompTarget({ rowId: row._id, slot })}
                              style={{
                                height: 48,
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                cursor: "pointer", gap: 3, opacity: 0.6,
                              }}
                            >
                              <Plus size={11} color="#059669" />
                              <span style={{ fontSize: 7.5, color: "#059669", fontWeight: 600 }}>Add</span>
                            </div>
                          )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {rows.length === 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 8.5, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Quick start
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {[
              { label: "1 col", fn: () => onAddRow(1) },
              { label: "2 cols", fn: () => onAddRow(2) },
              { label: "3 cols", fn: () => onAddRow(3) },
              { label: "4 cols", fn: () => onAddRow(4) },
            ].map(p => (
              <button
                key={p.label}
                onClick={p.fn}
                style={{
                  padding: "6px 4px",
                  fontSize: 9, fontWeight: 600, color: ROW_COLOR,
                  background: "#ecfdf5", border: "1px solid #a7f3d0",
                  borderRadius: 6, cursor: "pointer",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
