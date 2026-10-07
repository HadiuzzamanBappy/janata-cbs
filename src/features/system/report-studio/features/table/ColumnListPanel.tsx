import { Columns3, GripVertical, Plus } from "lucide-react";
import { useRef } from "react";
import { T } from "../../theme/tokens";
import type { Column } from "../../types/table";
import { deepClone } from "../../utils/deepClone";

/**
 * Left-rail column list for a TABLE component. Mouse-drag reorder via grip
 * handle, mirroring `ElementListPanel` (zones).
 *
 * Why the `columnsRef + onReorderRef` pattern: the `mousemove` handler is
 * attached for the lifetime of a drag, which can span multiple React
 * re-renders. Refs ensure the final commit sees the latest array and
 * callback, not the values captured at `mousedown` time.
 */
export function ColumnListPanel({
  columns,
  selId,
  onSel,
  onAdd,
  onReorder,
  onDelete,
}: {
  columns: Column[];
  selId: string | null;
  onSel: (id: string) => void;
  onAdd: () => void;
  onReorder: (cols: Column[]) => void;
  onDelete: (id: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const onGripMouseDown = (e: React.MouseEvent, startIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const list = listRef.current;
    if (!list) return;
    const itemEls = Array.from(list.querySelectorAll<HTMLElement>("[data-col-idx]"));
    let toIdx = startIdx;
    let toPos: "top" | "bottom" = "bottom";

    const draggedEl = itemEls[startIdx];
    if (draggedEl) draggedEl.style.opacity = "0.35";

    const clearIndicators = () =>
      itemEls.forEach((el) => {
        el.style.borderTopColor = "";
        el.style.borderTopWidth = "";
        el.style.borderBottomColor = "";
        el.style.borderBottomWidth = "";
      });

    const onMove = (me: MouseEvent) => {
      clearIndicators();
      for (let i = 0; i < itemEls.length; i++) {
        const r = itemEls[i].getBoundingClientRect();
        if (me.clientY >= r.top && me.clientY <= r.bottom) {
          toIdx = i;
          toPos = me.clientY < r.top + r.height / 2 ? "top" : "bottom";
          if (toPos === "top") {
            itemEls[i].style.borderTopColor = "#2563eb";
            itemEls[i].style.borderTopWidth = "2px";
          } else {
            itemEls[i].style.borderBottomColor = "#2563eb";
            itemEls[i].style.borderBottomWidth = "2px";
          }
          break;
        }
      }
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      clearIndicators();
      if (draggedEl) draggedEl.style.opacity = "";
      if (startIdx === toIdx) return;
      const cols = columnsRef.current;
      const arr = deepClone(cols);
      const [movedEl] = arr.splice(startIdx, 1);
      const adj = startIdx < toIdx ? toIdx - 1 : toIdx;
      let at = toPos === "top" ? adj : adj + 1;
      at = Math.max(0, Math.min(arr.length, at));
      arr.splice(at, 0, movedEl);
      onReorderRef.current(arr);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Columns3 size={10} />
          Columns
        </div>
        <button
          onClick={onAdd}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            padding: "3px 10px",
            borderRadius: 5,
            cursor: "pointer",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          <Plus size={11} style={{ marginRight: 3 }} />
          Add
        </button>
      </div>
      {columns.length === 0 && (
        <div
          style={{
            border: "1px dashed #e2e8f0",
            borderRadius: 8,
            padding: "14px 10px",
            textAlign: "center",
            color: "#cbd5e1",
            fontSize: 11,
          }}
        >
          No columns yet
        </div>
      )}
      <div ref={listRef}>
        {columns.map((col, idx) => {
          const isItemSelected = selId === col._id;
          return (
            <div
              key={col._id}
              data-col-idx={idx}
              onClick={() => onSel(col._id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 8px",
                marginBottom: 1,
                borderRadius: 6,
                cursor: "default",
                background: isItemSelected ? "#2563eb18" : T.bg2,
                borderTopWidth: "1px",
                borderBottomWidth: "1px",
                borderLeftWidth: "1px",
                borderRightWidth: "1px",
                borderTopStyle: "solid",
                borderBottomStyle: "solid",
                borderLeftStyle: "solid",
                borderRightStyle: "solid",
                borderTopColor: isItemSelected ? "#2563eb66" : T.border,
                borderBottomColor: isItemSelected ? "#2563eb66" : T.border,
                borderLeftColor: isItemSelected ? "#2563eb66" : T.border,
                borderRightColor: isItemSelected ? "#2563eb66" : T.border,
              }}
            >
              <div
                onMouseDown={(e) => onGripMouseDown(e, idx)}
                style={{
                  color: "#cbd5e1",
                  cursor: "grab",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 2px",
                  userSelect: "none",
                }}
              >
                <GripVertical size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: isItemSelected ? 700 : 500,
                    color: isItemSelected ? "#2563eb" : T.text,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.header}
                </div>
                <div
                  style={{ fontSize: 9, color: "#94a3b8", display: "flex", gap: 4, marginTop: 1 }}
                >
                  <span>{col.align[0]}</span>
                  <span>w{col.width}</span>
                  {col.format && <span style={{ color: "#d97706" }}>{col.format}</span>}
                  {col.aggregate && (
                    <span style={{ color: "#dc2626" }}>{col.aggregate.function}</span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(col._id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fca5a5",
                  cursor: "pointer",
                  fontSize: 13,
                  lineHeight: 1,
                  flexShrink: 0,
                  padding: "0 2px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#fca5a5")}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
