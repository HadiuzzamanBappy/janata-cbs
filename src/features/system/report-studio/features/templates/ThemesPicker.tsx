import { THEMES, type Theme } from "../../theme/themes";
import { PropTitle } from "../../components/layout/PropTitle";
import { T } from "../../theme/tokens";

/**
 * 3-column grid of one-click theme cards. Each card shows a colour swatch
 * mock (header bar + separator) plus the theme name in its accent colour.
 *
 * Pure UI — owner handles the actual `applyTheme(state, theme)` mutation
 * in the page-setup feature (Phase 7 reducer).
 */
export function ThemesPicker({ onApply }: { onApply: (t: Theme) => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <PropTitle label="Preset Themes" color="#7c3aed" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
        {THEMES.map(t => (
          <button
            key={t.name}
            onClick={() => onApply(t)}
            title={`Apply ${t.name} theme`}
            style={{
              background: T.bg,
              border: `1.5px solid ${t.color}40`,
              borderRadius: 8,
              padding: "9px 4px 7px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              transition: "all .15s",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                width: 26,
                height: 11,
                borderRadius: 3,
                background: t.tableHeader,
                boxShadow: "0 1px 3px rgba(0,0,0,.15)",
              }}
            />
            <div
              style={{
                width: 26,
                height: 2,
                borderRadius: 1,
                background: t.sepColor,
                opacity: 0.8,
              }}
            />
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: t.color,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
