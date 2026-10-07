import { useState } from "react";

/**
 * Top-level editor for the `centralData` record — multiple named arrays of
 * rows. Each key has an editable name, row-count badge, expand-to-edit
 * action, and a delete button. New keys are auto-named `dataset1`,
 * `dataset2`, etc.
 *
 * Rename behaviour: clicking into the name input arms `renamingKey` and
 * applies on blur or Enter. Escape cancels. Collisions abort with an alert
 * (preserving the monolith's UX exactly).
 */
export function CentralDataEditor({
  centralData,
  onChange,
}: {
  centralData: Record<string, any[]> | undefined;
  onChange: (cd: Record<string, any[]>) => void;
}) {
  const cd = centralData || {};
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const startEdit = (key: string) => {
    setEditingKey(key);
    setEditText(JSON.stringify(cd[key] || [], null, 2));
    setParseErr(null);
  };
  const cancelEdit = () => {
    setEditingKey(null);
    setParseErr(null);
  };
  const saveEdit = () => {
    if (!editingKey) return;
    try {
      const parsed = JSON.parse(editText);
      if (!Array.isArray(parsed)) {
        setParseErr("Must be a JSON array");
        return;
      }
      onChange({ ...cd, [editingKey]: parsed });
      setEditingKey(null);
      setParseErr(null);
    } catch (e: any) {
      setParseErr(e.message || "Invalid JSON");
    }
  };
  const addNew = () => {
    let n = 1;
    while (cd[`dataset${n}`]) n++;
    const newKey = `dataset${n}`;
    onChange({ ...cd, [newKey]: [] });
    startEdit(newKey);
  };
  const remove = (key: string) => {
    const next = { ...cd };
    delete next[key];
    onChange(next);
    if (editingKey === key) cancelEdit();
  };
  const startRename = (key: string) => {
    setRenamingKey(key);
    setRenameDraft(key);
  };
  const commitRename = (oldKey: string) => {
    const newKey = renameDraft.trim().replace(/\s+/g, "_");
    if (!newKey || newKey === oldKey) {
      setRenamingKey(null);
      return;
    }
    if (cd[newKey]) {
      alert(`Dataset "${newKey}" already exists.`);
      setRenamingKey(null);
      setRenameDraft("");
      return;
    }
    const next: Record<string, any[]> = {};
    for (const k of Object.keys(cd)) next[k === oldKey ? newKey : k] = cd[k];
    onChange(next);
    setRenamingKey(null);
  };

  const keys = Object.keys(cd);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {keys.length === 0 && (
        <div style={{ fontSize: 10, color: "#94a3b8", padding: "8px 0", textAlign: "center" }}>
          No data sources defined yet.
        </div>
      )}
      {keys.map((key) => {
        const arr = cd[key];
        const isEditing = editingKey === key;
        const isRenaming = renamingKey === key;
        return (
          <div
            key={key}
            style={{ border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 8px",
                gap: 6,
                background: isEditing ? "#eff6ff" : "transparent",
                borderBottom: isEditing ? "1px solid #bfdbfe" : "none",
              }}
            >
              <input
                value={isRenaming ? renameDraft : key}
                onFocus={() => startRename(key)}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={() => commitRename(key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  else if (e.key === "Escape") {
                    setRenamingKey(null);
                    e.currentTarget.blur();
                  }
                }}
                style={{
                  flex: 1,
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: "#1e40af",
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  padding: 0,
                }}
              />
              <span style={{ fontSize: 9, color: "#64748b" }}>
                {Array.isArray(arr) ? arr.length : 0} rows
              </span>
              <button
                onClick={() => (isEditing ? cancelEdit() : startEdit(key))}
                style={{
                  background: isEditing ? "#dbeafe" : "#f1f5f9",
                  border: "1px solid " + (isEditing ? "#93c5fd" : "#e2e8f0"),
                  color: "#475569",
                  padding: "2px 6px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 9,
                  fontWeight: 600,
                }}
              >
                {isEditing ? "Close" : "Edit"}
              </button>
              <button
                onClick={() => remove(key)}
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "2px 6px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 9,
                  fontWeight: 600,
                }}
              >
                ×
              </button>
            </div>
            {isEditing && (
              <div style={{ padding: 6 }}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    minHeight: 140,
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
                />
                {parseErr && (
                  <div
                    style={{
                      fontSize: 9,
                      color: "#dc2626",
                      padding: "4px 0",
                      fontFamily: "monospace",
                    }}
                  >
                    ⚠ {parseErr}
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button
                    onClick={saveEdit}
                    style={{
                      flex: 1,
                      background: "#2563eb",
                      border: "none",
                      color: "#fff",
                      padding: "5px 0",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      color: "#475569",
                      padding: "5px 12px",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button
        onClick={addNew}
        style={{
          background: "#f0fdf4",
          border: "1px dashed #86efac",
          color: "#059669",
          padding: "6px 0",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        + Add data source
      </button>
    </div>
  );
}
