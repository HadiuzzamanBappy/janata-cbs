import type { BodyComponent } from "../../types/body";
import { CentralDataEditor } from "./CentralDataEditor";

/**
 * Per-component panel: dropdown to bind to a named central data source,
 * plus an inline `CentralDataEditor` for managing the store.
 *
 * Three states:
 *  - No binding         → component falls back to legacy embedded data.
 *  - Bound, key exists  → green panel showing row count + first few fields.
 *  - Bound, missing key → red warning so users notice broken references
 *    (e.g. after deleting a dataset that's still linked elsewhere).
 */
export function DataSourceLink({
  comp,
  onUpdate,
  centralData,
  onUpdateCentralData,
}: {
  comp: BodyComponent;
  onUpdate: (c: BodyComponent) => void;
  centralData?: Record<string, any[]>;
  onUpdateCentralData?: (cd: Record<string, any[]>) => void;
}) {
  const cd = centralData || {};
  const keys = Object.keys(cd);
  const linked = comp.dataSourceKey;
  const linkedArr = linked && Array.isArray(cd[linked]) ? cd[linked] : null;
  const sampleKeys =
    linkedArr && linkedArr.length > 0 && typeof linkedArr[0] === "object"
      ? Object.keys(linkedArr[0]).slice(0, 6)
      : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#1e293b",
            marginBottom: 4,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Bind to data source
        </div>
        <select
          value={linked || ""}
          onChange={(e) => onUpdate({ ...comp, dataSourceKey: e.target.value || undefined })}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "5px 8px",
            border: "1px solid #e2e8f0",
            borderRadius: 4,
            fontSize: 11,
            background: "#fff",
            color: "#1e293b",
          }}
        >
          <option value="">— None (use embedded data) —</option>
          {keys.map((k) => (
            <option key={k} value={k}>
              {k} ({Array.isArray(cd[k]) ? cd[k].length : 0} rows)
            </option>
          ))}
        </select>
        {linked && !linkedArr && (
          <div style={{ fontSize: 9, color: "#dc2626", marginTop: 4 }}>
            ⚠ Bound to {linked} but no such data source exists. Add it below.
          </div>
        )}
        {linkedArr && (
          <div
            style={{
              marginTop: 6,
              padding: "6px 8px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 4,
              fontSize: 9,
              color: "#166534",
            }}
          >
            ✓ {linkedArr.length} row{linkedArr.length === 1 ? "" : "s"}
            {sampleKeys.length > 0 && (
              <div
                style={{
                  marginTop: 3,
                  fontFamily: "monospace",
                  color: "#15803d",
                }}
              >
                Fields: {sampleKeys.join(", ")}
                {Object.keys(linkedArr[0]).length > 6 ? "…" : ""}
              </div>
            )}
          </div>
        )}
      </div>
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#1e293b",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Manage central data
        </div>
        {onUpdateCentralData ? (
          <CentralDataEditor centralData={cd} onChange={onUpdateCentralData} />
        ) : (
          <div style={{ fontSize: 10, color: "#94a3b8" }}>Editor unavailable in this context.</div>
        )}
      </div>
    </div>
  );
}
