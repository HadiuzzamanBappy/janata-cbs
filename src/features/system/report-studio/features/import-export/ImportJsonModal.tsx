import { Check, Database, FileJson } from "lucide-react";
import { useRef, useState } from "react";
import { INITIAL_STATE } from "@/features/system/report-studio/initial-state";
import type { AppState } from "@/features/system/report-studio/types/app-state";
import type { BodyComponent, BodyRow } from "@/features/system/report-studio/types/body";
import { deepClone } from "@/features/system/report-studio/utils/deepClone";

/**
 * Import-JSON modal. Accepts two file shapes (preserved verbatim from the
 * monolith):
 *
 *   1. Design Save File (v2.0) — has `_meta.type === "design"` and a
 *      `_design` block carrying raw `AppState` in original units. Restored
 *      via deep-merge against `INITIAL_STATE` so future-added fields land
 *      with safe defaults. Logo + image base64 paths are NOT duplicated
 *      inside `_design` — they're stitched back from the main page export.
 *
 *   2. Legacy iText / report JSON — has a top-level `page` block but no
 *      `_meta.type`. Merged loosely; body data may be incomplete.
 *
 * Referential integrity: every `bodyComponent.rowId` must resolve to an
 * existing `bodyRow._id`; orphans fail the import with a count.
 */
export function ImportJsonModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (s: AppState) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyseRaw = (raw: string) => {
    setError(null);
    setPreview(null);
    if (!raw.trim()) return;
    try {
      const p = JSON.parse(raw);
      if (p?._meta?.type === "design") setPreview(p._meta);
    } catch (_) {
      /* not yet parseable */
    }
  };

  const tryParse = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") throw new Error("Not a valid JSON object");

      if (parsed._meta?.type === "design") {
        const src = parsed._design ?? parsed;
        const pg = src.page;
        if (!pg) throw new Error("Missing 'page' in design data");
        if (!pg.header) throw new Error("Missing 'page.header' in design data");
        if (!pg.footer) throw new Error("Missing 'page.footer' in design data");
        if (!Array.isArray(src.bodyRows)) throw new Error("Missing 'bodyRows' array");
        if (!Array.isArray(src.bodyComponents)) throw new Error("Missing 'bodyComponents' array");
        if (!Array.isArray(pg.header.elements))
          throw new Error("Header 'elements' must be an array");
        if (!Array.isArray(pg.footer.elements))
          throw new Error("Footer 'elements' must be an array");

        const rowIds = new Set((src.bodyRows as any[]).map((r: any) => r._id));
        const orphans = (src.bodyComponents as any[]).filter(
          (c: any) => c.rowId && !rowIds.has(c.rowId),
        );
        if (orphans.length > 0) {
          throw new Error(`${orphans.length} body component(s) reference missing row IDs`);
        }

        const base = deepClone(INITIAL_STATE);

        const restoreLogoPaths = (designElements: any[], mainElements: any[]) => {
          designElements.forEach((el, i) => {
            if (
              el.type === "LOGO" &&
              mainElements[i]?.type === "LOGO" &&
              mainElements[i].config?.path
            ) {
              if (!el.config) el.config = {};
              el.config.path = mainElements[i].config.path;
            }
          });
        };
        if (parsed.page?.header?.elements)
          restoreLogoPaths(pg.header.elements, parsed.page.header.elements);
        if (parsed.page?.footer?.elements)
          restoreLogoPaths(pg.footer.elements, parsed.page.footer.elements);

        const restoreImagePaths = (designComp: any, pageComp: any) => {
          if (designComp.type === "IMAGE" && pageComp?.type === "image" && pageComp.path) {
            designComp.imagePath = pageComp.path;
          }
        };
        if (parsed.page?.body && src.bodyComponents) {
          const pageBody = parsed.page.body as any[];
          pageBody.forEach((row) => {
            if (row.columns) {
              row.columns.forEach((pageComp: any, slotIdx: number) => {
                if (!pageComp) return;
                const designComp = (src.bodyComponents as any[]).find(
                  (c: any) =>
                    c.rowId === src.bodyRows[pageBody.indexOf(row)]?._id && c.slotIndex === slotIdx,
                );
                if (designComp) restoreImagePaths(designComp, pageComp);
              });
            }
          });
        }
        if (parsed.page?.freeComponents && src.bodyComponents) {
          (parsed.page.freeComponents as any[]).forEach((pageComp: any) => {
            const designComp = (src.bodyComponents as any[]).find((c: any) => c.freePosition);
            if (designComp) restoreImagePaths(designComp, pageComp);
          });
        }

        const restored: AppState = {
          compressLevel: parsed.compressLevel ?? base.compressLevel,
          memoryReduce: parsed.memoryReduce ?? base.memoryReduce,
          page: {
            size: pg.size ?? base.page.size,
            orientation: pg.orientation ?? base.page.orientation,
            margin: { ...base.page.margin, ...(pg.margin ?? {}) },
            header: {
              ...base.page.header,
              ...pg.header,
              padding: {
                ...base.page.header.padding,
                ...(pg.header.padding ?? {}),
              },
              margin: {
                ...base.page.header.margin,
                ...(pg.header.margin ?? {}),
              },
              radius: {
                ...base.page.header.radius,
                ...(pg.header.radius ?? {}),
              },
              elements: pg.header.elements ?? [],
            },
            footer: {
              ...base.page.footer,
              ...pg.footer,
              padding: {
                ...base.page.footer.padding,
                ...(pg.footer.padding ?? {}),
              },
              margin: {
                ...base.page.footer.margin,
                ...(pg.footer.margin ?? {}),
              },
              radius: {
                ...base.page.footer.radius,
                ...(pg.footer.radius ?? {}),
              },
              elements: pg.footer.elements ?? [],
            },
          },
          bodyRows: src.bodyRows as BodyRow[],
          bodyComponents: src.bodyComponents as BodyComponent[],
          componentDataSources: src.componentDataSources ?? undefined,
          centralData: src.centralData ?? undefined,
          reportVariables: src.reportVariables ?? undefined,
        };
        onImport(restored);
        return;
      }

      // Legacy / iText shape
      if (!parsed.page) throw new Error("Not a valid Report Studio file — missing 'page'");
      const base = deepClone(INITIAL_STATE);
      const merged: AppState = {
        ...base,
        compressLevel: parsed.compressLevel ?? base.compressLevel,
        memoryReduce: parsed.memoryReduce ?? base.memoryReduce,
        page: {
          ...base.page,
          ...(parsed.page || {}),
          header: { ...base.page.header, ...(parsed.page?.header || {}) },
          footer: { ...base.page.footer, ...(parsed.page?.footer || {}) },
        },
        bodyRows: parsed.bodyRows ?? base.bodyRows,
        bodyComponents: parsed.bodyComponents ?? base.bodyComponents,
      };
      onImport(merged);
    } catch (e: any) {
      setError(e.message || "Invalid JSON");
    }
  };

  const handleFile = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      const t = r.result as string;
      setText(t);
      setError(null);
      analyseRaw(t);
    };
    r.readAsText(file);
  };

  const isDesign = !!preview;
  const accentColor = isDesign ? "#059669" : "#2563eb";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.65)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(580px,92vw)",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,.25)",
          maxHeight: "88vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#fff",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#1e293b",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <Database size={15} color={accentColor} />
              Import JSON
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
              Drop or paste a <strong>Design Save File</strong> to fully restore your design
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              width: 32,
              height: 32,
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "14px 18px", flex: 1, overflow: "auto" }}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#2563eb" : isDesign ? "#059669" : "#cbd5e1"}`,
              borderRadius: 10,
              padding: "18px",
              textAlign: "center",
              background: dragOver ? "#eff6ff" : isDesign ? "#f0fdf4" : "#fff",
              cursor: "pointer",
              marginBottom: 12,
              transition: "all .15s",
            }}
          >
            <FileJson
              size={24}
              color={dragOver ? "#2563eb" : isDesign ? "#059669" : "#94a3b8"}
              style={{ display: "block", margin: "0 auto 8px" }}
            />
            <div
              style={{
                fontSize: 11,
                color: dragOver ? "#2563eb" : isDesign ? "#059669" : "#64748b",
                fontWeight: 600,
              }}
            >
              {isDesign
                ? "✓ Design Save File detected"
                : "Drop a .json file here, or click to browse"}
            </div>
            <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 4 }}>
              Accepts: Design Save File (v2.0) · Legacy report config
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {isDesign && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: 9,
                padding: "10px 14px",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#059669",
                  marginBottom: 7,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Check size={12} />
                Design Save File — full restore preview
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px 16px",
                  fontSize: 9.5,
                }}
              >
                {[
                  ["Page", `${preview.pageSize ?? "?"} · ${preview.orientation ?? "?"}`],
                  ["Saved", preview.savedAt ? new Date(preview.savedAt).toLocaleString() : "—"],
                  ["Body rows", `${preview.bodyRows ?? "?"} row(s)`],
                  ["Components", `${preview.bodyComponents ?? "?"} component(s)`],
                  ["Header items", `${preview.headerElements ?? "?"} element(s)`],
                  ["Footer items", `${preview.footerElements ?? "?"} element(s)`],
                  ["Version", `v${preview.version ?? "1.0"}`],
                  ["Generator", preview.generator ?? "Report Studio"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 5, alignItems: "baseline" }}>
                    <span
                      style={{
                        color: "#6b7280",
                        minWidth: 78,
                        flexShrink: 0,
                        fontSize: 9,
                      }}
                    >
                      {k}:
                    </span>
                    <span style={{ fontWeight: 600, color: "#111827" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 9,
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Check size={10} />
                All elements, body rows, components, header &amp; footer will be fully restored
              </div>
            </div>
          )}

          <div
            style={{
              fontSize: 9,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 5,
              fontWeight: 700,
            }}
          >
            Or paste JSON directly
          </div>
          <textarea
            value={text}
            onChange={(e) => {
              const v = e.target.value;
              setText(v);
              setError(null);
              analyseRaw(v);
            }}
            placeholder="Paste Design Save File JSON here..."
            style={{
              width: "100%",
              height: 150,
              fontFamily: "'Fira Code','Courier New',monospace",
              fontSize: 11,
              border: `1px solid ${error ? "#fca5a5" : isDesign ? "#86efac" : "#e2e8f0"}`,
              borderRadius: 8,
              padding: "10px 12px",
              resize: "vertical",
              outline: "none",
              background: error ? "#fff5f5" : "#fff",
              color: "#1e293b",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: 7,
                padding: "8px 11px",
                fontSize: 10.5,
                color: "#dc2626",
                marginTop: 7,
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
              }}
            >
              <span style={{ flexShrink: 0 }}>⚠️</span>
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "10px 18px",
            borderTop: "1px solid #e2e8f0",
            background: "#fff",
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {isDesign && (
            <span
              style={{
                fontSize: 9.5,
                color: "#059669",
                fontWeight: 600,
                marginRight: "auto",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Check size={11} />
              Full design restore ready
            </span>
          )}
          {!isDesign && <span style={{ flex: 1 }} />}
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              padding: "7px 18px",
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => tryParse(text)}
            disabled={!text.trim()}
            style={{
              background: text.trim() ? (isDesign ? "#059669" : "#2563eb") : "#cbd5e1",
              color: "#fff",
              border: "none",
              padding: "7px 22px",
              borderRadius: 7,
              cursor: text.trim() ? "pointer" : "not-allowed",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "background .15s",
            }}
          >
            {isDesign ? (
              <>
                <Check size={12} />
                Restore Design
              </>
            ) : (
              <>Import &amp; Load</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
