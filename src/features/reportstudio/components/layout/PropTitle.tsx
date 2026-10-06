import { Plus } from "lucide-react";
import { T } from "../../theme/tokens";

/**
 * Thinner section title bar — used inside cards and other places where the
 * full collapsible `PropSection` chrome would be too heavy.
 */
export function PropTitle({
  label,
  color = "#2563eb",
  onAdd,
  addLabel,
}: {
  label: string;
  color?: string;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 7,
        marginTop: 10,
        paddingBottom: 4,
        borderBottom: `1.5px solid ${color}22`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 3, height: 12, background: color, borderRadius: 2 }} />
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: T.text,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {label}
        </span>
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          style={{
            background: color + "18",
            border: `1px solid ${color}44`,
            color,
            fontSize: 8.5,
            padding: "2px 8px",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Plus size={9} />
          {addLabel || "Add"}
        </button>
      )}
    </div>
  );
}
