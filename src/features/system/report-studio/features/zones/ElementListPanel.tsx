import {
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  LayoutGrid,
  Lock,
  Plus,
  Trash2,
  Unlock,
} from "lucide-react";
import { useRef, useState } from "react";
import { PALETTE } from "../../constants/preview-data";
import { T } from "../../theme/tokens";
import type { ZoneElement } from "../../types/zone";
import { deepClone } from "../../utils/deepClone";

/**
 * Left-rail element list for a header/footer zone. Supports:
 *   - Add (palette pop-out with TEXT/LOGO/SEP/DATE/PAGE buttons + optional Row).
 *   - Mouse-drag reorder via grip handle. Drop indicators are drawn by
 *     temporarily setting `border-top` / `border-bottom` of the hovered item
 *     — no separate placeholder element is needed.
 *   - Per-item hide / lock / duplicate / delete actions.
 *
 * The `elementsRef` + `onReorderRef` pattern preserves access to the latest
 * values inside long-lived `mousemove` listeners — without it, drags that
 * span multiple renders would commit stale arrays.
 */
export function ElementListPanel({
  zone,
  elements,
  selId,
  onSel,
  onAdd,
  onReorder,
  onDelete,
  onToggleHidden,
  onToggleLocked,
  onDuplicate,
  onAddRow,
}: {
  zone: "header" | "footer";
  elements: ZoneElement[];
  selId: string | null;
  onSel: (id: string) => void;
  onAdd: (type: string) => void;
  onReorder: (els: ZoneElement[]) => void;
  onDelete: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddRow?: () => void;
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const color = zone === "header" ? "#2563eb" : "#7c3aed";
  const listRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const onGripMouseDown = (e: React.MouseEvent, startIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const list = listRef.current;
    if (!list) return;

    const itemEls = Array.from(list.querySelectorAll<HTMLElement>("[data-item-idx]"));
    const fromIdx = startIdx;
    let toIdx = startIdx;
    let toPos: "top" | "bottom" = "bottom";

    const draggedEl = itemEls[fromIdx];
    if (draggedEl) draggedEl.style.opacity = "0.35";

    const clearIndicators = () => {
      itemEls.forEach((el) => {
        el.style.borderTopColor = "";
        el.style.borderTopWidth = "";
        el.style.borderBottomColor = "";
        el.style.borderBottomWidth = "";
      });
    };

    const onMove = (me: MouseEvent) => {
      clearIndicators();
      for (let i = 0; i < itemEls.length; i++) {
        const r = itemEls[i].getBoundingClientRect();
        if (me.clientY >= r.top && me.clientY <= r.bottom) {
          toIdx = i;
          toPos = me.clientY < r.top + r.height / 2 ? "top" : "bottom";
          const el = itemEls[i];
          if (toPos === "top") {
            el.style.borderTopColor = color;
            el.style.borderTopWidth = "2px";
          } else {
            el.style.borderBottomColor = color;
            el.style.borderBottomWidth = "2px";
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

      if (fromIdx === toIdx) return;
      const els = elementsRef.current;
      const arr = deepClone(els);
      const [movedEl] = arr.splice(fromIdx, 1);
      const adj = fromIdx < toIdx ? toIdx - 1 : toIdx;
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
          <Layers size={10} />
          Elements
        </div>
        <button
          onClick={() => setIsPickerOpen((p) => !p)}
          style={{
            background: color,
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
      {isPickerOpen && (
        <div
          style={{
            background: T.bg2,
            border: `1px solid ${color}33`,
            borderRadius: 8,
            padding: "8px",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "#94a3b8",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Choose type
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {PALETTE.filter((p) => p.zone).map((p) => {
              const Icon = (p as any).Icon as any;
              return (
                <button
                  key={p.type}
                  onClick={() => {
                    onAdd(p.type);
                    setIsPickerOpen(false);
                  }}
                  style={{
                    background: p.color + "15",
                    border: `1px solid ${p.color}44`,
                    color: p.color,
                    padding: "4px 8px",
                    borderRadius: 5,
                    cursor: "pointer",
                    fontSize: 9.5,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {Icon && <Icon size={12} strokeWidth={2.5} />}
                  {p.label}
                </button>
              );
            })}
            {onAddRow && (
              <button
                onClick={() => {
                  onAddRow();
                  setIsPickerOpen(false);
                }}
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  color: "#16a34a",
                  padding: "4px 8px",
                  borderRadius: 5,
                  cursor: "pointer",
                  fontSize: 9.5,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <LayoutGrid size={12} strokeWidth={2.5} />
                Row
              </button>
            )}
          </div>
        </div>
      )}
      {elements.length === 0 && !isPickerOpen && (
        <div
          style={{
            border: "1px dashed #e2e8f0",
            borderRadius: 8,
            padding: 14,
            textAlign: "center",
            color: "#cbd5e1",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Layers size={13} style={{ color: "#d1d5db" }} />
          No elements — click Add to start
        </div>
      )}
      <div ref={listRef}>
        {elements.map((el, idx) => {
          const paletteEntry = PALETTE.find((p) => p.type === el.type) as any;
          const PaletteIcon = paletteEntry?.Icon;
          const isItemSelected = selId === el._id;
          const isHidden = !!el.hidden;
          const isLocked = !!el.locked;
          const label =
            el.type === "TEXT" || el.type === "DATE_TIME"
              ? el.config.text?.slice(0, 20) || el.type
              : el.type === "LOGO"
                ? `LOGO (${el.config.width}×${el.config.height})`
                : el.type;
          return (
            <div
              key={el._id}
              data-item-idx={idx}
              onClick={() => onSel(el._id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 8px",
                marginBottom: 1,
                borderRadius: 6,
                cursor: "default",
                background: isItemSelected ? color + "18" : T.bg2,
                borderTopWidth: "1px",
                borderBottomWidth: "1px",
                borderLeftWidth: "1px",
                borderRightWidth: "1px",
                borderTopStyle: "solid",
                borderBottomStyle: "solid",
                borderLeftStyle: "solid",
                borderRightStyle: "solid",
                borderTopColor: isItemSelected ? color + "66" : T.border,
                borderBottomColor: isItemSelected ? color + "66" : T.border,
                borderLeftColor: isItemSelected ? color + "66" : T.border,
                borderRightColor: isItemSelected ? color + "66" : T.border,
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
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: (paletteEntry?.color || "#000") + "18",
                  border: `1px solid ${paletteEntry?.color || "#000"}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: paletteEntry?.color,
                  flexShrink: 0,
                }}
              >
                {PaletteIcon && <PaletteIcon size={11} strokeWidth={2.5} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: isItemSelected ? 700 : 500,
                    color: isItemSelected ? color : T.text,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "#94a3b8",
                    marginTop: 1,
                    display: "flex",
                    gap: 4,
                    alignItems: "center",
                  }}
                >
                  <span>{el.type}</span>
                  {isHidden && (
                    <span
                      style={{
                        background: "#fef3c7",
                        color: "#92400e",
                        fontSize: 8,
                        padding: "0 4px",
                        borderRadius: 3,
                        fontWeight: 700,
                      }}
                    >
                      HIDDEN
                    </span>
                  )}
                  {isLocked && (
                    <span
                      style={{
                        background: "#fef3c7",
                        color: "#92400e",
                        fontSize: 8,
                        padding: "0 4px",
                        borderRadius: 3,
                        fontWeight: 700,
                      }}
                    >
                      LOCKED
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                <button
                  title={isHidden ? "Show" : "Hide"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleHidden(el._id);
                  }}
                  style={{
                    background: isHidden ? "#fef3c7" : "none",
                    border: "none",
                    color: isHidden ? "#d97706" : "#cbd5e1",
                    cursor: "pointer",
                    width: 20,
                    height: 20,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = isHidden ? "#92400e" : "#94a3b8")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = isHidden ? "#d97706" : "#cbd5e1")
                  }
                >
                  {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
                <button
                  title={isLocked ? "Unlock" : "Lock"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLocked(el._id);
                  }}
                  style={{
                    background: isLocked ? "#fef3c7" : "none",
                    border: "none",
                    color: isLocked ? "#d97706" : "#cbd5e1",
                    cursor: "pointer",
                    width: 20,
                    height: 20,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = isLocked ? "#92400e" : "#94a3b8")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = isLocked ? "#d97706" : "#cbd5e1")
                  }
                >
                  {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
                </button>
                <button
                  title="Duplicate"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(el._id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#cbd5e1",
                    cursor: "pointer",
                    width: 20,
                    height: 20,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#059669")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                >
                  <Copy size={11} />
                </button>
                <button
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(el._id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fca5a5",
                    cursor: "pointer",
                    width: 20,
                    height: 20,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#fca5a5")}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
