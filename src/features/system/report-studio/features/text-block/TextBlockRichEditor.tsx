import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Minus,
  Settings2,
  Trash2,
  RefreshCw,
} from "@/features/system/report-studio/theme/icons";
import type { BodyComponent } from "../../types/body";
import type { ReportVariable } from "../../types/text-block";
import { deltaToParas } from "@/features/system/report-studio/data/deltaToParas";
import {
  DEFAULT_TABLE_STYLE,
  buildTableHtml,
  readTableStyle,
  makeCellStyle,
} from "./quillTableStyle";
import { QuillTableStylePanel } from "./QuillTableStylePanel";

function TextBlockRichEditor({
  comp,
  onUpdate,
  reportVariables,
  componentDataSources,
  centralData,
}: {
  comp: BodyComponent;
  onUpdate: (c: BodyComponent) => void;
  reportVariables?: ReportVariable[];
  componentDataSources?: Record<string, any[]>;
  centralData?: Record<string, any[]>;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const tableBtnRef = useRef<HTMLButtonElement>(null);
  const quillRef = useRef<any>(null);
  const saveTimer = useRef<any>(null);
  const compRef = useRef(comp); // always fresh comp for callbacks
  compRef.current = comp;
  const menuRef = useRef<HTMLDivElement | null>(null); // kept for cleanup compat
  const [ready, setReady] = useState(false);
  // Table picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerRows, setPickerRows] = useState(3);
  const [pickerCols, setPickerCols] = useState(3);
  const [hoverRows, setHoverRows] = useState(0);
  const [hoverCols, setHoverCols] = useState(0);

  // Wait for Quill
  useEffect(() => {
    if ((window as any).Quill) {
      setReady(true);
      return;
    }
    const id = setInterval(() => {
      if ((window as any).Quill) {
        setReady(true);
        clearInterval(id);
      }
    }, 150);
    return () => clearInterval(id);
  }, []);

  // Close context menu and picker on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      menuRef.current?.remove();
      menuRef.current = null;
      // Close picker if click is outside the table button area
      if (
        tableBtnRef.current &&
        !tableBtnRef.current.contains(e.target as Node)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  // Register TableBlot + size whitelist once Quill is available
  useEffect(() => {
    if (!ready) return;
    const Q = (window as any).Quill;
    if (Q._tableBlotRegistered) return;
    Q._tableBlotRegistered = true;

    // Register pixel-based style size attributor so the toolbar size picker
    // stores exact values ("8px"…"48px") in the delta. deltaToParas strips
    // the "px" suffix to get pt values for the PDF renderer.
    const SizeStyle = Q.import("attributors/style/size");
    SizeStyle.whitelist = [
      "8px",
      "9px",
      "10px",
      "11px",
      "12px",
      "14px",
      "16px",
      "18px",
      "20px",
      "24px",
      "28px",
      "32px",
      "36px",
      "48px",
    ];
    Q.register(SizeStyle, true);

    // BlockEmbed blot that holds the table.
    // value format: { rows: string[][], html: string }
    // rows = 2D array of cell texts (for PDF)
    // html = full table HTML (for re-rendering)
    const BlockEmbed = Q.import("blots/block/embed");
    class TableBlot extends BlockEmbed {
      static create(value: any) {
        const node = super.create() as HTMLElement;
        // Accept both a plain HTML string (legacy) and a {rows,html,tableStyle} object
        const html = typeof value === "string" ? value : value?.html || "";

        // Set innerHTML — the HTML already has correct inline styles from makeCellStyle
        node.innerHTML = html;

        // Only ensure the table layout CSS is applied (doesn't affect colors/borders)
        const table = node.querySelector("table") as HTMLTableElement | null;
        if (table) {
          table.style.borderCollapse = "collapse";
          table.style.width = "100%";
          table.style.tableLayout = "fixed";
          table.style.display = "table";
        }
        node.querySelectorAll("tr").forEach((tr) => {
          const el = tr as HTMLElement;
          if (!el.style.display) el.style.display = "table-row";
        });

        // Only ensure cells are editable — DO NOT overwrite their color/border/bg styles
        node.querySelectorAll("td,th").forEach((td) => {
          const el = td as HTMLElement;
          if (!el.style.display) el.style.display = "table-cell";
          el.setAttribute("contenteditable", "true");
        });

        // Fallback for legacy HTML with no inline styles: apply default cell style
        const firstTd = node.querySelector("td,th") as HTMLElement | null;
        if (firstTd && !firstTd.style.border) {
          node.querySelectorAll("td,th").forEach((td) => {
            const el = td as HTMLElement;
            el.style.cssText = `display:table-cell;border:1.5px solid #94a3b8;padding:6px 9px;min-width:60px;vertical-align:top;font-size:12px;line-height:1.5;color:#1e293b;background:#fff;word-break:break-word;`;
            el.setAttribute("contenteditable", "true");
          });
          const firstRow = node.querySelector("tr");
          if (firstRow) {
            Array.from(firstRow.querySelectorAll("td,th")).forEach((td) => {
              const el = td as HTMLElement;
              el.style.background = "#f1f5f9";
              el.style.fontWeight = "700";
            });
          }
        }

        return node;
      }
      static value(node: HTMLElement) {
        // Extract rows from live DOM (captures user edits to cells)
        const trs = Array.from(node.querySelectorAll("tr"));
        const rows = trs.map((tr) =>
          Array.from(tr.querySelectorAll("td,th")).map((td) =>
            (td.textContent || "").replace(/ /g, " ").trim(),
          ),
        );
        // Read style config from data-ts attribute on the table
        let tableStyle = null;
        const table = node.querySelector("table");
        if (table) {
          try {
            tableStyle = JSON.parse(table.getAttribute("data-ts") || "null");
          } catch (_) { }
        }
        return { rows, html: node.innerHTML, tableStyle };
      }
    }
    TableBlot.blotName = "table-embed";
    TableBlot.tagName = "div";
    TableBlot.className = "ql-table-wrap";
    Q.register(TableBlot, true);
  }, [ready]);

  // Insert table embed at current cursor position
  const insertTable = (rows: number, cols: number) => {
    const q = quillRef.current;
    if (!q) return;
    const range = q.getSelection(true);
    const index = range ? range.index : q.getLength();
    const html = buildTableHtml(rows, cols);
    const rowsData: string[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(""),
    );
    q.insertEmbed(index, "table-embed", { rows: rowsData, html }, "user");
    q.insertText(index + 1, "\n", "user");
    q.setSelection(index + 2, 0);
  };

  // Table context menu state — React-driven, matches app design language exactly
  const [tableMenu, setTableMenu] = useState<{
    x: number;
    y: number;
    cell: HTMLElement;
    row: HTMLTableRowElement;
    tbody: HTMLTableSectionElement;
    table: HTMLTableElement;
    wrap: HTMLElement;
    ci: number;
    view: "actions" | "style";
    openedAt: number;
    currentStyle: typeof DEFAULT_TABLE_STYLE;
  } | null>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);

  // Close on outside click — but NOT when clicking inside the menu or a color palette
  useEffect(() => {
    if (!tableMenu) return;
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (tableMenuRef.current && tableMenuRef.current.contains(t)) return;
      // Don't close if clicking inside a TSSwatch palette (position:fixed, outside menu DOM)
      if (t.closest("[data-ts-palette]")) return;
      setTableMenu(null);
    };
    setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => document.removeEventListener("mousedown", h);
  }, [tableMenu]);

  const showTableMenu = (e: MouseEvent, cell: HTMLElement) => {
    e.preventDefault();
    e.stopPropagation();
    const row = cell.closest("tr") as HTMLTableRowElement;
    const tbody = cell.closest("tbody") as HTMLTableSectionElement;
    const table = cell.closest("table") as HTMLTableElement;
    const wrap = cell.closest(".ql-table-wrap") as HTMLElement;
    const ci = Array.from(row.cells).indexOf(cell as HTMLTableCellElement);

    // Convert "rgb(r, g, b)" or "rgba(...)" to "#rrggbb"
    const toHex = (color: string): string => {
      if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)")
        return "";
      if (color.startsWith("#")) return color;
      const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return "";
      return (
        "#" +
        [m[1], m[2], m[3]]
          .map((n) => parseInt(n).toString(16).padStart(2, "0"))
          .join("")
      );
    };

    // Read inline style first, fall back to computed
    const get = (el: HTMLElement | null, prop: string): string => {
      if (!el) return "";
      return (
        el.style.getPropertyValue(prop) ||
        getComputedStyle(el).getPropertyValue(prop) ||
        ""
      );
    };

    const trs = Array.from(table.querySelectorAll("tr"));
    const hdrTd = trs[0]?.querySelector("td,th") as HTMLElement | null;
    const bdy1 = trs[1]?.querySelector("td,th") as HTMLElement | null;
    const bdy2 = trs[2]?.querySelector("td,th") as HTMLElement | null;

    // Border: read from inline style attribute directly (most reliable)
    const borderInline = hdrTd?.style.border || hdrTd?.style.borderTop || "";
    const bp = borderInline.trim().split(/\s+/);
    const borderWidth = bp[0]
      ? String(parseFloat(bp[0]))
      : DEFAULT_TABLE_STYLE.borderWidth;
    const borderStyle = bp[1] || DEFAULT_TABLE_STYLE.borderStyle;
    const borderColor =
      toHex(bp[2] || "") ||
      toHex(get(hdrTd, "border-color")) ||
      DEFAULT_TABLE_STYLE.borderColor;

    // Alt row: check if rows 1 and 2 have different backgrounds
    const bg1 = toHex(get(bdy1, "background-color"));
    const bg2 = toHex(get(bdy2, "background-color"));
    const altRowBg = bg2 && bg2 !== bg1 ? bg2 : "";

    const currentStyle: typeof DEFAULT_TABLE_STYLE = {
      borderColor,
      borderWidth,
      borderStyle,
      headerBg:
        toHex(get(hdrTd, "background-color")) || DEFAULT_TABLE_STYLE.headerBg,
      headerColor:
        toHex(get(hdrTd, "color")) || DEFAULT_TABLE_STYLE.headerColor,
      headerBold: parseInt(get(hdrTd, "font-weight") || "400") >= 700,
      cellBg:
        toHex(get(bdy1, "background-color")) || DEFAULT_TABLE_STYLE.cellBg,
      cellColor: toHex(get(bdy1, "color")) || DEFAULT_TABLE_STYLE.cellColor,
      altRowBg,
      cellPadding: get(hdrTd, "padding") || DEFAULT_TABLE_STYLE.cellPadding,
      fontSize: String(
        parseFloat(
          get(hdrTd, "font-size") || DEFAULT_TABLE_STYLE.fontSize + "px",
        ) || 12,
      ),
      tableDsRef: DEFAULT_TABLE_STYLE.tableDsRef,
    };

    const cellRect = cell.getBoundingClientRect();
    const menuW = 220,
      menuH = 340;
    const vw = window.innerWidth,
      vh = window.innerHeight;
    const x =
      cellRect.right + menuW > vw
        ? Math.max(8, cellRect.left - menuW)
        : cellRect.right;
    const y =
      cellRect.bottom + menuH > vh
        ? Math.max(8, cellRect.top - menuH)
        : cellRect.bottom;

    setTableMenu({
      x,
      y,
      cell,
      row,
      tbody,
      table,
      wrap,
      ci,
      view: "actions",
      openedAt: Date.now(),
      currentStyle,
    });
  };

  // ── TableContextMenu ───────────────────────────────────────────────
  // Rendered as a proper React subtree — correct hook usage, no conditional hooks

  const triggerSave = () => {
    const q = quillRef.current;
    if (!q) return;
    clearTimeout(saveTimer.current);
    const delta = q.getContents();
    const paras = deltaToParas(delta);
    onUpdate({ ...compRef.current, quillDelta: delta, paragraphs: paras });
  };

  // Mount Quill
  useEffect(() => {
    if (!ready || !mountRef.current || !toolbarRef.current || quillRef.current)
      return;
    const Q = (window as any).Quill;

    const q = new Q(mountRef.current, {
      theme: "snow",
      placeholder: "Start typing…",
      modules: {
        toolbar: { container: toolbarRef.current },
      },
    });

    // Right-click inside table cells
    (mountRef.current as HTMLElement).addEventListener(
      "contextmenu",
      (e: any) => {
        const td = (e.target as HTMLElement).closest("td");
        if (td) showTableMenu(e, td as HTMLElement);
      },
    );

    // Load saved content
    if (comp.quillDelta?.ops) {
      q.setContents(comp.quillDelta);
    } else if (comp.paragraphs?.length) {
      const ops: any[] = [];
      comp.paragraphs.forEach((p) => {
        const attrs: any = {};
        if (p.bold) attrs.bold = true;
        if (p.italic) attrs.italic = true;
        if ((p as any).underline) attrs.underline = true;
        if (p.fontColor && p.fontColor !== "#374151") attrs.color = p.fontColor;
        if (p.font === "TIMES") attrs.font = "serif";
        if (p.font === "COURIER") attrs.font = "monospace";
        if (p.text)
          ops.push({
            insert: p.text,
            attributes: Object.keys(attrs).length ? attrs : undefined,
          });
        const blk: any = {};
        if (p.align === "CENTER") blk.align = "center";
        if (p.align === "RIGHT") blk.align = "right";
        if (p.align === "JUSTIFIED") blk.align = "justify";
        ops.push({
          insert: "\n",
          attributes: Object.keys(blk).length ? blk : undefined,
        });
      });
      q.setContents({ ops });
    }

    // Auto-save on change (debounced 400ms)
    q.on("text-change", () => {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const delta = q.getContents();
        const paras = deltaToParas(delta);
        onUpdate({ ...compRef.current, quillDelta: delta, paragraphs: paras });
      }, 400);
    });

    quillRef.current = q;
    return () => {
      clearTimeout(saveTimer.current);
      menuRef.current?.remove();
    };
  }, [ready]);

  const insertToken = (varName: string) => {
    const q = quillRef.current;
    if (!q) return;
    const range = q.getSelection(true) || {
      index: q.getLength() - 1,
      length: 0,
    };
    const token = `{{${varName}}}`;
    q.insertText(
      range.index,
      token,
      { background: "#fef3c7", color: "#92400e" },
      "user",
    );
    q.setSelection(range.index + token.length, 0);
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", width: "100%" }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {comp.repeatMode && comp.repeatMode !== "none" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            marginBottom: 2,
            background: "#ede9fe",
            border: "1px solid #c4b5fd",
            borderRadius: 5,
            fontSize: 8.5,
            color: "#6d28d9",
            fontWeight: 700,
          }}
        >
          <RefreshCw size={9} color="#7c3aed" />
          {comp.repeatMode === "new-page"
            ? "Repeats per row — new page each"
            : "Repeats per row — inline"}
          {comp.repeatDataSourceRef &&
            (() => {
              let rows: any[] = [];
              if (comp.repeatDataSourceRef.startsWith("comp:"))
                rows =
                  componentDataSources?.[comp.repeatDataSourceRef.slice(5)] ||
                  [];
              else if (comp.repeatDataSourceRef.startsWith("central:"))
                rows = centralData?.[comp.repeatDataSourceRef.slice(8)] || [];
              return rows.length > 0 ? (
                <span style={{ fontWeight: 400, color: "#7c3aed" }}>
                  ({rows.length} rows)
                </span>
              ) : null;
            })()}
        </div>
      )}

      {(reportVariables || []).length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            padding: "4px 8px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderBottom: "none",
            borderRadius: "6px 6px 0 0",
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: "#92400e",
              fontWeight: 700,
              alignSelf: "center",
            }}
          >
            Variables:
          </span>
          {(reportVariables || []).map((v) => (
            <button
              key={v._id}
              onMouseDown={(e) => {
                e.preventDefault();
                insertToken(v.name);
              }}
              style={{
                fontSize: 9,
                padding: "1px 7px",
                background: "#fff",
                border: "1px solid #fde68a",
                borderRadius: 4,
                cursor: "pointer",
                color: "#92400e",
                fontFamily: "monospace",
                fontWeight: 600,
              }}
            >
              {`{{${v.name}}}`}
            </button>
          ))}
        </div>
      )}

      {!ready && (
        <div
          style={{
            padding: "12px",
            color: "#94a3b8",
            fontSize: 11,
            textAlign: "center",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
          }}
        >
          Loading editor…
        </div>
      )}

      {/* Quill toolbar — rendered as real DOM, passed to Quill via container ref */}
      <div
        ref={toolbarRef}
        style={{
          display: ready ? "flex" : "none",
          flexWrap: "wrap",
          alignItems: "center",
          padding: "3px 6px",
          gap: 2,
          border: "1px solid #e2e8f0",
          borderBottom: "none",
          borderRadius: "6px 6px 0 0",
          background: "#fafbfc",
        }}
      >
        <span className="ql-formats">
          <select className="ql-header" defaultValue="">
            <option value="1">H1</option>
            <option value="2">H2</option>
            <option value="3">H3</option>
            <option value="">¶</option>
          </select>
        </span>
        <span className="ql-formats">
          <select className="ql-size" defaultValue="">
            <option value="">— pt —</option>
            <option value="8px">8</option>
            <option value="9px">9</option>
            <option value="10px">10</option>
            <option value="11px">11</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
            <option value="28px">28</option>
            <option value="32px">32</option>
            <option value="36px">36</option>
            <option value="48px">48</option>
          </select>
        </span>
        <span className="ql-formats">
          <button className="ql-bold" />
          <button className="ql-italic" />
          <button className="ql-underline" />
          <button className="ql-strike" />
        </span>
        <span className="ql-formats">
          <select className="ql-color" />
          <select className="ql-background" />
        </span>
        <span className="ql-formats">
          <select className="ql-align" />
        </span>
        <span className="ql-formats">
          <button className="ql-list" value="ordered" />
          <button className="ql-list" value="bullet" />
        </span>
        <span className="ql-formats" style={{ position: "relative" }}>
          {/* Table button — opens picker panel */}
          <button
            ref={tableBtnRef}
            className="ql-table-btn"
            title="Insert table"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPicker((p) => !p);
            }}
          >
            ⊞ Table
          </button>

          {/* Table picker dropdown */}
          {showPicker && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 9999,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "12px 14px",
                boxShadow: "0 6px 24px rgba(0,0,0,.13)",
                minWidth: 220,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#1e293b",
                  marginBottom: 10,
                }}
              >
                Insert table
              </div>

              {/* Row × Col inputs */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#64748b",
                      marginBottom: 3,
                      fontWeight: 600,
                    }}
                  >
                    Rows
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={pickerRows}
                    onChange={(e) =>
                      setPickerRows(Math.max(1, Math.min(20, +e.target.value)))
                    }
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 5,
                      fontSize: 12,
                      outline: "none",
                      textAlign: "center",
                      boxSizing: "border-box" as const,
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#64748b",
                      marginBottom: 3,
                      fontWeight: 600,
                    }}
                  >
                    Columns
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={pickerCols}
                    onChange={(e) =>
                      setPickerCols(Math.max(1, Math.min(10, +e.target.value)))
                    }
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 5,
                      fontSize: 12,
                      outline: "none",
                      textAlign: "center",
                      boxSizing: "border-box" as const,
                    }}
                  />
                </div>
              </div>

              {/* Visual grid hover picker (up to 8×8 preview) */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 5 }}>
                  {hoverRows > 0 && hoverCols > 0
                    ? `${hoverRows} × ${hoverCols} table`
                    : "Or hover to pick size"}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(8,18px)",
                    gap: 2,
                  }}
                >
                  {Array.from({ length: 8 * 8 }).map((_, i) => {
                    const r = Math.floor(i / 8) + 1;
                    const c = (i % 8) + 1;
                    const lit =
                      r <= (hoverRows || pickerRows) &&
                      c <= (hoverCols || pickerCols);
                    return (
                      <div
                        key={i}
                        onMouseEnter={() => {
                          setHoverRows(r);
                          setHoverCols(c);
                        }}
                        onMouseLeave={() => {
                          setHoverRows(0);
                          setHoverCols(0);
                        }}
                        onClick={() => {
                          const finalR = hoverRows || pickerRows;
                          const finalC = hoverCols || pickerCols;
                          setPickerRows(finalR);
                          setPickerCols(finalC);
                          insertTable(finalR, finalC);
                          setShowPicker(false);
                          setHoverRows(0);
                          setHoverCols(0);
                        }}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 2,
                          cursor: "pointer",
                          background: lit ? "#3b82f6" : "#f1f5f9",
                          border: `1px solid ${lit ? "#2563eb" : "#e2e8f0"}`,
                          transition: "background .05s",
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Insert button */}
              <button
                onClick={() => {
                  const finalR = hoverRows || pickerRows;
                  const finalC = hoverCols || pickerCols;
                  insertTable(finalR, finalC);
                  setShowPicker(false);
                  setHoverRows(0);
                  setHoverCols(0);
                }}
                style={{
                  width: "100%",
                  padding: "7px 0",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Insert {hoverRows || pickerRows} × {hoverCols || pickerCols}
              </button>
            </div>
          )}
        </span>
        <span className="ql-formats">
          <button className="ql-clean" />
        </span>
      </div>

      <div
        ref={mountRef}
        style={{ display: ready ? "block" : "none", width: "100%" }}
      />

      {/* Table context menu — rendered as React portal matching app design */}
      {/* Table context menu */}
      {(() => {
        if (!tableMenu) return null;
        const { x, y, row, tbody, table, wrap, ci, view } = tableMenu;

        const menuStyle: React.CSSProperties = {
          position: "fixed",
          left: x,
          top: y,
          zIndex: 9999,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,.18)",
          width: 210,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          fontSize: 11,
          color: "#1e293b",
          overflow: "hidden",
        };

        const div = (
          <div style={{ height: 1, background: "#f1f5f9", margin: "3px 0" }} />
        );

        const Item = ({
          icon,
          label,
          onClick,
          danger = false,
          keepOpen = false,
        }: {
          icon: React.ReactNode;
          label: string;
          onClick: () => void;
          danger?: boolean;
          keepOpen?: boolean;
        }) => {
          const [hov, setHov] = useState(false);
          return (
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                onClick();
                if (!keepOpen) {
                  setTableMenu(null);
                  setTimeout(() => triggerSave(), 30);
                }
              }}
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 12px",
                cursor: "pointer",
                userSelect: "none",
                color: danger ? "#dc2626" : "#1e293b",
                background: hov
                  ? danger
                    ? "#fef2f2"
                    : "#f8fafc"
                  : "transparent",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: danger ? "#f87171" : "#94a3b8",
                  flexShrink: 0,
                }}
              >
                {icon}
              </span>
              <span style={{ fontSize: 11.5 }}>{label}</span>
            </div>
          );
        };

        const newCell = (isHeader = false, s = readTableStyle(table)) => {
          const td = document.createElement("td");
          td.setAttribute("contenteditable", "true");
          td.innerHTML = "&nbsp;";
          td.style.cssText = makeCellStyle(s, isHeader);
          return td;
        };

        const addRow = (before: boolean) => {
          const s = readTableStyle(table);
          const newRow = document.createElement("tr");
          newRow.style.display = "table-row";
          for (let i = 0; i < row.cells.length; i++)
            newRow.appendChild(newCell(false, s));
          tbody.insertBefore(newRow, before ? row : row.nextSibling);
        };

        const delRow = () => {
          if (tbody.rows.length > 1) row.remove();
          else wrap?.remove();
        };

        const addCol = (before: boolean) => {
          const s = readTableStyle(table);
          Array.from(tbody.rows).forEach((tr, ri) => {
            const cell = newCell(ri === 0, s);
            tr.insertBefore(
              cell,
              before ? tr.cells[ci] : tr.cells[ci + 1] || null,
            );
          });
        };

        const delCol = () => {
          if (row.cells.length > 1) {
            Array.from(tbody.rows).forEach((tr) => tr.cells[ci]?.remove());
          } else wrap?.remove();
        };

        if (view === "style") {
          // Find which table index this wrap corresponds to
          const q = quillRef.current;
          const allWraps = q
            ? (Array.from(
              q.root.querySelectorAll(".ql-table-wrap"),
            ) as HTMLElement[])
            : [];
          const tableIdx = allWraps.indexOf(wrap);

          // Use the style captured at right-click time — always in sync with live table
          const savedStyle = tableMenu.currentStyle;
          return (
            <div
              ref={tableMenuRef}
              style={menuStyle}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <QuillTableStylePanel
                key={`style-${tableIdx}-${tableMenu.openedAt}`}
                table={table}
                onClose={() => setTableMenu(null)}
                onBack={() =>
                  setTableMenu((m) => (m ? { ...m, view: "actions" } : null))
                }
                savedStyle={savedStyle}
                onSave={(s) => {
                  const c = compRef.current;
                  const existing = (c.tableBindings || {})[tableIdx] || {
                    dsRef: "",
                    arrayField: "",
                    colMap: [],
                  };
                  onUpdate({
                    ...c,
                    tableBindings: {
                      ...(c.tableBindings || {}),
                      [tableIdx]: { ...existing, style: s },
                    },
                  });
                }}
              />
            </div>
          );
        }

        // Actions view
        return (
          <div
            ref={tableMenuRef}
            style={{ ...menuStyle, padding: "4px 0" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Rows */}
            <div
              style={{
                padding: "2px 12px 1px",
                fontSize: 9,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: ".07em",
              }}
            >
              Rows
            </div>
            <Item
              icon={<Plus size={12} />}
              label="Insert row above"
              onClick={() => addRow(true)}
            />
            <Item
              icon={<Plus size={12} />}
              label="Insert row below"
              onClick={() => addRow(false)}
            />
            <Item
              icon={<Minus size={12} />}
              label="Delete row"
              onClick={delRow}
              danger
            />

            {div}

            {/* Columns */}
            <div
              style={{
                padding: "2px 12px 1px",
                fontSize: 9,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: ".07em",
              }}
            >
              Columns
            </div>
            <Item
              icon={<Plus size={12} />}
              label="Insert column left"
              onClick={() => addCol(true)}
            />
            <Item
              icon={<Plus size={12} />}
              label="Insert column right"
              onClick={() => addCol(false)}
            />
            <Item
              icon={<Minus size={12} />}
              label="Delete column"
              onClick={delCol}
              danger
            />

            {div}

            {/* Style + Delete */}
            <Item
              icon={<Settings2 size={12} />}
              label="Table style…"
              keepOpen
              onClick={() =>
                setTableMenu((m) =>
                  m ? { ...m, view: "style", openedAt: Date.now() } : null,
                )
              }
            />

            {div}

            <Item
              icon={<Trash2 size={12} />}
              label="Delete table"
              onClick={() => {
                wrap?.remove();
              }}
              danger
            />
          </div>
        );
      })()}

      {ready && (
        <div
          style={{
            fontSize: 8,
            color: "#94a3b8",
            padding: "2px 8px",
            background: "#f8fafc",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          Right-click any table cell for row / column options
        </div>
      )}
    </div>
  );
}

export { TextBlockRichEditor };
