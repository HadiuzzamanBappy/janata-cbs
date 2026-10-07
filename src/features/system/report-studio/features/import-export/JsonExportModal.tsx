import { Check, Copy, FileJson, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { JsonNode } from "./JsonNode";

/**
 * Export-JSON modal — tree + raw view, search, copy/download.
 *
 * Two view modes:
 *   - tree: collapsible `JsonNode` recursion with search highlight.
 *   - raw:  regex-syntax-highlighted text with search highlight overlay.
 *
 * Copy path tries `navigator.clipboard.writeText` first, falls back to a
 * hidden textarea + `document.execCommand("copy")` for older browsers. The
 * monolith's behaviour is preserved verbatim.
 */
export function JsonExportModal({ data, onClose }: { data: any; onClose: () => void }) {
  const [isCopied, setIsCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "raw">("tree");
  const jsonString = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const searchLow = search.toLowerCase().trim();

  const handleCopy = () => {
    const doCopy = () => {
      const ta = document.createElement("textarea");
      ta.value = jsonString;
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
      } catch (_) {
        /* no-op */
      }
      document.body.removeChild(ta);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(jsonString)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(doCopy);
    } else doCopy();
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report-studio-export.json";
    a.style.cssText = "position:fixed;top:-9999px;left:-9999px";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const highlightedRaw = useMemo(() => {
    const escaped = jsonString.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          if (/:$/.test(match))
            return `<span style="color:#1e40af;font-weight:700">${match}</span>`;
          return `<span style="color:#059669">${match}</span>`;
        }
        if (/true|false/.test(match))
          return `<span style="color:#d97706;font-weight:600">${match}</span>`;
        if (/null/.test(match))
          return `<span style="color:#94a3b8;font-style:italic">${match}</span>`;
        return `<span style="color:#0891b2">${match}</span>`;
      },
    );
  }, [jsonString]);

  const rawWithSearch = useMemo(() => {
    if (!searchLow) return highlightedRaw;
    return highlightedRaw.replace(
      new RegExp(searchLow.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
      (m) => `<mark style="background:#fef08a;color:#1e293b;border-radius:2px">${m}</mark>`,
    );
  }, [highlightedRaw, searchLow]);

  const matchCount = useMemo(() => {
    if (!searchLow) return 0;
    return jsonString.toLowerCase().split(searchLow).length - 1;
  }, [jsonString, searchLow]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.55)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(980px,96vw)",
          height: "88vh",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Export JSON</div>
                <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>
                  iText Report JSON · includes raw design state for full re-import
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <span
                  style={{
                    background: "#eff6ff",
                    color: "#2563eb",
                    fontSize: 8.5,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 4,
                  }}
                >
                  units: pt
                </span>
                <span
                  style={{
                    background: "#f0fdf4",
                    color: "#059669",
                    fontSize: 8.5,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 4,
                  }}
                >
                  iText7
                </span>
                <span
                  style={{
                    background: "#f5f3ff",
                    color: "#7c3aed",
                    fontSize: 8.5,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 4,
                  }}
                >
                  _design ✓
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 9, color: "#94a3b8" }}>
                {jsonString.length.toLocaleString()} chars
              </span>
              <button
                onClick={handleCopy}
                style={{
                  background: isCopied ? "#f0fdf4" : "#f8fafc",
                  border: `1px solid ${isCopied ? "#86efac" : "#e2e8f0"}`,
                  color: isCopied ? "#059669" : "#475569",
                  padding: "5px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all .15s",
                }}
              >
                {isCopied ? (
                  <>
                    <Check size={11} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#2563eb",
                  padding: "5px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FileJson size={11} />
                Download
              </button>
              <button
                onClick={onClose}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
              <Search
                size={12}
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  pointerEvents: "none",
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search keys or values…"
                style={{
                  width: "100%",
                  padding: "5px 10px 5px 28px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  color: "#1e293b",
                  fontSize: 11,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: 13,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            {searchLow && (
              <span
                style={{
                  fontSize: 9.5,
                  color: matchCount > 0 ? "#059669" : "#dc2626",
                  fontWeight: 600,
                }}
              >
                {matchCount > 0
                  ? `${matchCount} match${matchCount !== 1 ? "es" : ""}`
                  : "No matches"}
              </span>
            )}
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: 0,
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              {(["tree", "raw"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  style={{
                    padding: "4px 12px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: 700,
                    background: viewMode === m ? "#2563eb" : "transparent",
                    color: viewMode === m ? "#fff" : "#64748b",
                    transition: "all .12s",
                  }}
                >
                  {m === "tree" ? "🌲 Tree" : "{ } Raw"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "14px 18px", background: "#f8fafc" }}>
          {viewMode === "tree" ? (
            <div
              style={{
                fontFamily: "'Fira Code','Courier New',monospace",
                fontSize: 12,
                color: "#1e293b",
              }}
            >
              <JsonNode
                propKey={null}
                v={data}
                depth={0}
                defaultCollapsed={false}
                searchLow={searchLow}
              />
            </div>
          ) : (
            <pre
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.8,
                fontFamily: "'Fira Code','Courier New',monospace",
                color: "#1e293b",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
              dangerouslySetInnerHTML={{ __html: rawWithSearch }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
