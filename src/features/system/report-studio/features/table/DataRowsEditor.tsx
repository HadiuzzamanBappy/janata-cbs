import { Check, Plus, X } from "lucide-react";
import { type CSSProperties, useRef, useState } from "react";
import { T } from "../../theme/tokens";
import type { Column } from "../../types/table";

/**
 * Two-mode editor for a TABLE's `tableDataRows`:
 *   - Grid: spreadsheet-style table input.
 *   - JSON: textarea with apply button + parse error display.
 *
 * Column keys are derived from `columns` (preferred) or from the first
 * row's object keys (legacy fallback). Switching to JSON mode snapshots
 * the current rows so external row-list changes don't stomp the user's
 * draft.
 */
export function DataRowsEditor({
  rows,
  columns,
  onChange,
}: {
  rows: Record<string, any>[];
  columns: Column[];
  onChange: (rows: Record<string, any>[]) => void;
}) {
  const [mode, setMode] = useState<"grid" | "json">("grid");
  const [jsonText, setJsonText] = useState(() =>
    rows.length > 0 ? JSON.stringify(rows, null, 2) : "[]",
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync jsonText when rows change externally (e.g. row add/delete from grid).
  const lastRowsRef = useRef(rows);
  if (rows !== lastRowsRef.current) {
    lastRowsRef.current = rows;
    if (mode === "json") {
      setJsonText(JSON.stringify(rows, null, 2));
    }
  }

  const keys: string[] =
    columns.length > 0
      ? columns.map((c) => c.dataKey || c.header)
      : rows.length > 0
        ? Object.keys(rows[0])
        : [];

  const updateCell = (ri: number, key: string, val: string) => {
    const next = rows.map((r, i) => (i === ri ? { ...r, [key]: val } : r));
    onChange(next);
  };

  const addRow = () => {
    const blank: Record<string, any> = {};
    keys.forEach((k) => {
      blank[k] = "";
    });
    onChange([...rows, blank]);
  };

  const deleteRow = (ri: number) => {
    onChange(rows.filter((_, i) => i !== ri));
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error("Must be a JSON array");
      setJsonError(null);
      onChange(parsed);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const monoTA: CSSProperties = {
    width: "100%",
    fontFamily: "'Fira Code','Courier New',monospace",
    fontSize: 10,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    padding: "8px 10px",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    background: T.bg2,
    color: T.text,
    lineHeight: 1.5,
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {(["grid", "json"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              if (m === "json") setJsonText(JSON.stringify(rows, null, 2));
              setMode(m);
            }}
            style={{
              flex: 1,
              padding: "4px 0",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 9.5,
              fontWeight: 700,
              border: `1.5px solid ${mode === m ? "#059669" : T.border}`,
              background: mode === m ? "rgba(5, 150, 105, 0.15)" : T.bg,
              color: mode === m ? "#10b981" : T.muted,
            }}
          >
            {m === "grid" ? "🗂 Grid" : "{ } JSON"}
          </button>
        ))}
      </div>

      {mode === "grid" && (
        <div>
          {keys.length === 0 && rows.length === 0 && (
            <div style={{ textAlign: "center", padding: "12px 0", color: T.muted, fontSize: 9 }}>
              No columns yet — add columns first, then add data rows.
            </div>
          )}
          {(keys.length > 0 || rows.length > 0) && (
            <div style={{ overflowX: "auto", marginBottom: 6 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 9.5,
                  tableLayout: "fixed",
                }}
              >
                <colgroup>
                  {keys.map((k) => (
                    <col key={k} style={{ minWidth: 60 }} />
                  ))}
                  <col style={{ width: 22 }} />
                </colgroup>
                <thead>
                  <tr>
                    {keys.map((k) => (
                      <th
                        key={k}
                        style={{
                          background: T.bg2,
                          border: `1px solid ${T.border}`,
                          padding: "3px 5px",
                          textAlign: "left",
                          fontSize: 8.5,
                          fontWeight: 700,
                          color: T.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {k}
                      </th>
                    ))}
                    <th style={{ background: T.bg2, border: `1px solid ${T.border}`, width: 22 }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri}>
                      {keys.map((k) => (
                        <td key={k} style={{ border: `1px solid ${T.border}`, padding: 0 }}>
                          <input
                            value={row[k] ?? ""}
                            onChange={(e) => updateCell(ri, k, e.target.value)}
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              padding: "3px 5px",
                              fontSize: 9.5,
                              fontFamily: "inherit",
                              background: "transparent",
                              color: T.text,
                              boxSizing: "border-box",
                            }}
                          />
                        </td>
                      ))}
                      <td
                        style={{ border: `1px solid ${T.border}`, textAlign: "center", padding: 0 }}
                      >
                        <button
                          onClick={() => deleteRow(ri)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "2px 4px",
                            color: "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <X size={10} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            onClick={addRow}
            style={{
              width: "100%",
              padding: "5px 0",
              borderRadius: 6,
              border: "1.5px dashed #059669",
              background: "#f0fdf4",
              color: "#059669",
              cursor: "pointer",
              fontSize: 9.5,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Plus size={11} /> Add Row
          </button>
        </div>
      )}

      {mode === "json" && (
        <div>
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonError(null);
            }}
            rows={10}
            style={monoTA}
            placeholder={
              '[\n  { "name": "Alice", "salary": 5000 },\n  { "name": "Bob",   "salary": 6500 }\n]'
            }
          />
          {jsonError && (
            <div
              style={{
                fontSize: 9,
                color: "#ef4444",
                marginTop: 3,
                padding: "3px 6px",
                background: "#fef2f2",
                borderRadius: 4,
                border: "1px solid #fecaca",
              }}
            >
              ⚠ {jsonError}
            </div>
          )}
          <button
            onClick={applyJson}
            style={{
              marginTop: 6,
              width: "100%",
              padding: "5px 0",
              borderRadius: 6,
              background: "#059669",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 9.5,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Check size={11} /> Apply JSON
          </button>
        </div>
      )}
    </div>
  );
}
