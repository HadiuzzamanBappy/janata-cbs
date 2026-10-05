import { useState, type ChangeEvent } from "react";
import { ChevronDown, ChevronUp, Database, Plus, Upload } from "lucide-react";
import { T } from "../../theme/tokens";
import { inputStyle } from "../../theme/inputStyle";
import { csvToRows } from "../../utils/csv";

/**
 * Embedded dataset manager — lets users create, edit, and delete named
 * central datasets (and a per-component dataset) without needing a Table or
 * Chart on the canvas first.
 *
 * Used by the TEXT_BLOCK props panel's variable-mapping section and by the
 * dedicated Data Sources tab.
 *
 * Modes:
 *   - JSON: paste a top-level array `[{...}, {...}]`.
 *   - CSV : header row plus data rows. Numeric coercion via `Number()`.
 *
 * Editing state is tracked via `editingDs`:
 *   - `null`     — nothing being edited, dataset list shown.
 *   - `"__new__"` — creating a brand-new central dataset.
 *   - `"comp"`    — editing the per-component dataset.
 *   - any key    — editing the named central dataset.
 */
export function InlineDataManager({
  centralData,
  onUpdateCentralData,
  componentDataSources,
  onUpdateComponentDataSources,
  compId,
}: {
  centralData?: Record<string, any[]>;
  onUpdateCentralData?: (cd: Record<string, any[]>) => void;
  componentDataSources?: Record<string, any[]>;
  onUpdateComponentDataSources?: (cds: Record<string, any[]>) => void;
  compId: string;
}) {
  const cd = centralData || {};
  const compRows = componentDataSources?.[compId];

  const [open, setOpen] = useState(false);
  const [editingDs, setEditingDs] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftText, setDraftText] = useState("[\n  {}\n]");
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [mode, setMode] = useState<"json" | "csv">("json");

  const totalCount = Object.keys(cd).length + (compRows && compRows.length > 0 ? 1 : 0);

  const startNew = () => {
    let n = 1;
    while (cd[`dataset${n}`]) n++;
    setDraftName(`dataset${n}`);
    setDraftText("[\n  {}\n]");
    setParseErr(null);
    setMode("json");
    setEditingDs("__new__");
  };

  const startEdit = (key: string, rows: any[]) => {
    setDraftName(key);
    setDraftText(JSON.stringify(rows, null, 2));
    setParseErr(null);
    setMode("json");
    setEditingDs(key === "__comp__" ? "comp" : key);
  };

  const save = () => {
    try {
      let parsed: any;
      if (mode === "csv") {
        parsed = csvToRows(draftText);
      } else {
        parsed = JSON.parse(draftText);
        if (!Array.isArray(parsed)) throw new Error("Must be a JSON array");
      }
      const name = draftName.trim().replace(/\s+/g, "_") || "dataset1";
      if (editingDs === "comp") {
        onUpdateComponentDataSources?.({ ...componentDataSources, [compId]: parsed });
      } else {
        onUpdateCentralData?.({ ...cd, [name]: parsed });
      }
      setEditingDs(null);
    } catch (e: any) {
      setParseErr(e.message || "Parse error");
    }
  };

  const deleteDs = (key: string) => {
    if (key === "__comp__") {
      const next = { ...componentDataSources };
      delete next[compId];
      onUpdateComponentDataSources?.(next);
    } else {
      const next = { ...cd };
      delete next[key];
      onUpdateCentralData?.(next);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      if (file.name.endsWith(".csv")) {
        setMode("csv");
        setDraftText(text);
      } else {
        setMode("json");
        setDraftText(text);
      }
      setParseErr(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const allDs: { key: string; label: string; rows: any[] }[] = [];
  if (compRows && compRows.length > 0) {
    allDs.push({ key: "__comp__", label: "This component", rows: compRows });
  }
  Object.entries(cd).forEach(([k, v]) => allDs.push({ key: k, label: k, rows: v || [] }));

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          <Database size={10} color="#2563eb" />
          <span style={{ fontSize: 9, fontWeight: 700, color: "#2563eb" }}>
            Datasets {totalCount > 0 ? `(${totalCount})` : ""}
          </span>
          {open ? <ChevronUp size={10} color="#64748b" /> : <ChevronDown size={10} color="#64748b" />}
        </button>
        <button
          onClick={startNew}
          style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 8.5, padding: "2px 8px",
            background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: 5, cursor: "pointer",
            color: "#2563eb", fontWeight: 700,
          }}
        >
          <Plus size={9} />
          New dataset
        </button>
      </div>

      {open && allDs.length > 0 && editingDs === null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
          {allDs.map(d => {
            const cols = d.rows.length > 0 ? Object.keys(d.rows[0]) : [];
            return (
              <div key={d.key} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 9px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: cols.length > 0 ? 4 : 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#1e293b", fontFamily: "monospace", flex: 1 }}>
                    {d.label}
                  </span>
                  <span style={{ fontSize: 8, color: "#64748b" }}>{d.rows.length} rows</span>
                  <button
                    onClick={() => startEdit(d.key, d.rows)}
                    style={{ fontSize: 8, padding: "1px 6px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 4, cursor: "pointer", color: "#475569" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteDs(d.key)}
                    style={{ fontSize: 8, padding: "1px 6px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, cursor: "pointer", color: "#dc2626" }}
                  >
                    ×
                  </button>
                </div>
                {cols.length > 0 && (
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {cols.map(c => (
                      <span key={c} style={{ fontSize: 7.5, fontFamily: "monospace", background: "#dbeafe", color: "#1d4ed8", borderRadius: 3, padding: "1px 5px" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {open && allDs.length === 0 && editingDs === null && (
        <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", padding: "6px 0", fontStyle: "italic" }}>
          No datasets yet — click <strong>New dataset</strong> to add one
        </div>
      )}

      {editingDs !== null && (
        <div style={{ background: "#fff", border: "1px solid #bfdbfe", borderRadius: 7, padding: "10px 10px", marginBottom: 4 }}>
          {editingDs !== "comp" && (
            <div style={{ marginBottom: 7 }}>
              <div style={{ fontSize: 9, color: T.label, fontWeight: 600, marginBottom: 3 }}>Dataset name</div>
              <input
                value={draftName}
                onChange={e => setDraftName(e.target.value.replace(/\s+/g, "_"))}
                style={{ ...inputStyle, fontFamily: "monospace", fontWeight: 700 }}
                placeholder="my_dataset"
              />
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
            {(["json", "csv"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setParseErr(null); }}
                style={{
                  fontSize: 9, padding: "2px 9px", borderRadius: 4,
                  cursor: "pointer", fontWeight: 700, textTransform: "uppercase",
                  background: mode === m ? "#2563eb" : "#f1f5f9",
                  color: mode === m ? "#fff" : "#64748b",
                  border: `1px solid ${mode === m ? "#2563eb" : "#e2e8f0"}`,
                }}
              >
                {m}
              </button>
            ))}
            <label
              style={{
                marginLeft: "auto", display: "flex", alignItems: "center", gap: 3,
                fontSize: 8.5, color: "#2563eb", cursor: "pointer",
                border: "1px solid #bfdbfe", borderRadius: 4, padding: "2px 7px", background: "#eff6ff",
              }}
            >
              <Upload size={9} />Upload
              <input type="file" accept=".json,.csv,.txt" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
          </div>

          <textarea
            value={draftText}
            onChange={e => { setDraftText(e.target.value); setParseErr(null); }}
            style={{
              width: "100%", boxSizing: "border-box", minHeight: 140,
              fontFamily: "monospace", fontSize: 9,
              border: `1px solid ${parseErr ? "#fca5a5" : "#cbd5e1"}`,
              borderRadius: 5, padding: 7, resize: "vertical",
              background: "#0f172a", color: "#e2e8f0", lineHeight: 1.5,
            }}
            placeholder={
              mode === "csv"
                ? "name,age,city\nJohn,30,New York\nJane,25,London"
                : '[\n  {"name": "John", "age": 30},\n  {"name": "Jane", "age": 25}\n]'
            }
          />

          {parseErr && (
            <div style={{ fontSize: 8.5, color: "#dc2626", fontFamily: "monospace", marginTop: 3 }}>
              ⚠ {parseErr}
            </div>
          )}

          <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
            <button
              onClick={save}
              style={{
                flex: 1, background: "#2563eb", border: "none", color: "#fff",
                padding: "6px 0", borderRadius: 5, cursor: "pointer",
                fontSize: 10, fontWeight: 700,
              }}
            >
              Save
            </button>
            <button
              onClick={() => { setEditingDs(null); setParseErr(null); }}
              style={{
                background: "#f1f5f9", border: "1px solid #e2e8f0",
                color: "#64748b", padding: "6px 12px", borderRadius: 5,
                cursor: "pointer", fontSize: 10,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
