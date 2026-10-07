import { useEffect, useState } from "react";

/**
 * Inline JSON editor for a single component's dataset
 * (`componentDataSources[comp._id]`).
 *
 * Dirty-flag pattern preserved from monolith: while user is typing we don't
 * stomp their draft from external prop changes. `useEffect` only refreshes
 * the text when no edits are pending. Pressing Save commits and clears
 * dirty; Reset reverts to the prop value.
 */
export function ComponentDataEditor({
  compId: _compId,
  data,
  onChange,
}: {
  compId: string;
  data: any[] | undefined;
  onChange: (rows: any[]) => void;
}) {
  const rows = data || [];
  const [editText, setEditText] = useState(JSON.stringify(rows, null, 2));
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setEditText(JSON.stringify(rows, null, 2));
    }
  }, [rows, isDirty]);

  const handleChange = (val: string) => {
    setEditText(val);
    setIsDirty(true);
    setParseErr(null);
  };

  const save = () => {
    try {
      const parsed = JSON.parse(editText);
      if (!Array.isArray(parsed)) {
        setParseErr("Must be a JSON array");
        return;
      }
      onChange(parsed);
      setIsDirty(false);
      setParseErr(null);
    } catch (e: any) {
      setParseErr(e.message || "Invalid JSON");
    }
  };

  const reset = () => {
    setEditText(JSON.stringify(rows, null, 2));
    setIsDirty(false);
    setParseErr(null);
  };

  const sampleKeys =
    rows.length > 0 && typeof rows[0] === "object" ? Object.keys(rows[0]).slice(0, 6) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.length > 0 && (
        <div
          style={{
            padding: "6px 8px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 4,
            fontSize: 9,
            color: "#166534",
          }}
        >
          ✓ {rows.length} row{rows.length === 1 ? "" : "s"}
          {sampleKeys.length > 0 && (
            <div style={{ marginTop: 3, fontFamily: "monospace", color: "#15803d" }}>
              Fields: {sampleKeys.join(", ")}
              {Object.keys(rows[0]).length > 6 ? "…" : ""}
            </div>
          )}
        </div>
      )}
      <textarea
        value={editText}
        onChange={(e) => handleChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          minHeight: 180,
          fontFamily: "monospace",
          fontSize: 9.5,
          border: "1px solid #cbd5e1",
          borderRadius: 4,
          padding: 6,
          resize: "vertical",
          background: "#0f172a",
          color: "#e2e8f0",
          lineHeight: 1.4,
        }}
        placeholder={
          '[\n  {"field1": "value1", "field2": 100},\n  {"field1": "value2", "field2": 200}\n]'
        }
      />
      {parseErr && (
        <div style={{ fontSize: 9, color: "#dc2626", fontFamily: "monospace" }}>⚠ {parseErr}</div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={save}
          disabled={!isDirty}
          style={{
            flex: 1,
            background: isDirty ? "#2563eb" : "#cbd5e1",
            border: "none",
            color: "#fff",
            padding: "6px 0",
            borderRadius: 4,
            cursor: isDirty ? "pointer" : "not-allowed",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          Save
        </button>
        <button
          onClick={reset}
          disabled={!isDirty}
          style={{
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            color: "#475569",
            padding: "6px 12px",
            borderRadius: 4,
            cursor: isDirty ? "pointer" : "not-allowed",
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
