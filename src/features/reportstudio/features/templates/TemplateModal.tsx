import { Check, LayoutTemplate } from "lucide-react";
import { REPORT_TEMPLATES, type ReportTemplate } from "../../constants/preview-data";
import { ZoneSvgPreview } from "./ZoneSvgPreview";
import { T } from "../../theme/tokens";

/**
 * Template-picker modal. One card per template; each card renders the
 * actual header/footer via `ZoneSvgPreview` so users see what they'll get.
 *
 * Hover-fade behaviour driven by injected CSS — same as the monolith. The
 * `<style>` block is scoped to `.tpl-card` and `.tpl-apply` and is safe to
 * mount alongside other modals (no global selectors).
 */
export function TemplateModal({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (t: ReportTemplate) => void;
}) {
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
          width: "min(900px,96vw)",
          maxHeight: "90vh",
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,.35)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          .tpl-card {
            border: 2px solid ${T.border};
            border-radius: 10px;
            overflow: hidden;
            cursor: pointer;
            background: ${T.bg};
            box-shadow: 0 1px 4px rgba(0,0,0,.06);
            transition: border-color .22s ease, box-shadow .22s ease, transform .22s ease;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .tpl-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.25); }
          .tpl-apply {
            margin-top: 5px; color: #fff; font-size: 9.5px; font-weight: 700;
            padding: 3px 8px; border-radius: 5px; display: inline-flex;
            align-items: center; gap: 4px; opacity: 0; transform: translateY(4px);
            transition: opacity .2s ease, transform .2s ease;
          }
          .tpl-card:hover .tpl-apply { opacity: 1; transform: translateY(0); }
          .tpl-card:hover .tpl-overlay { opacity: 1; }
          .tpl-overlay { opacity: 0; transition: opacity .22s ease; }
        `}</style>

        <div
          style={{
            padding: "16px 22px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
              <LayoutTemplate size={16} color="#7c3aed" />
              Report Templates
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
              Choose a template to apply its header &amp; footer. Body components are preserved.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: T.bg2,
              border: `1px solid ${T.border}`,
              color: T.muted,
              width: 32,
              height: 32,
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            padding: "18px 22px",
            overflow: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
            gap: 16,
          }}
        >
          {REPORT_TEMPLATES.map(t => (
            <div
              key={t.id}
              className="tpl-card"
              style={{ ["--accent" as any]: t.accent }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = t.accent;
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px ${t.accent}30`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = T.border;
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,.06)";
              }}
              onClick={() => {
                onApply(t);
                onClose();
              }}
            >
              {/* Paper Sheet Preview (Fills remaining height) */}
              <div
                style={{
                  background: "#ffffff",
                  overflow: "hidden",
                  position: "relative",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <ZoneSvgPreview zone={t.header} accent={t.accent} />
                  <div className="tpl-overlay" style={{ position: "absolute", inset: 0, background: t.accent + "0c", pointerEvents: "none" }} />
                </div>
                {/* Mock Paper Sheet Body Preview */}
                <div style={{ background: "#ffffff", padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  {[70, 55, 85, 45].map((w, i) => (
                    <div key={i} style={{ height: 3, background: "#e2e8f0", borderRadius: 2, marginBottom: 4, width: `${w}%` }} />
                  ))}
                </div>
                <div style={{ flexShrink: 0 }}>
                  <ZoneSvgPreview zone={t.footer} accent={t.accent} />
                </div>
              </div>

              {/* Fixed-Height Information Footer */}
              <div
                style={{
                  height: 90,
                  minHeight: 90,
                  maxHeight: 90,
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  background: T.bg,
                  borderTop: `1px solid ${T.border}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: T.text, marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 9, height: 9, borderRadius: 2, background: t.accent, flexShrink: 0 }} />
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: T.muted,
                      lineHeight: 1.35,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {t.description}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 18 }}>
                  <div className="tpl-apply" style={{ background: t.accent }}>
                    <Check size={10} />
                    Apply Template
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "10px 22px", borderTop: `1px solid ${T.border}`, background: T.bg2, flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: T.muted }}>
            💡 Templates only replace the header &amp; footer. All body rows and components remain untouched.
          </div>
        </div>
      </div>
    </div>
  );
}
