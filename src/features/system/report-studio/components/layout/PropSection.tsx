import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { T } from "../../theme/tokens";

/**
 * Collapsible section with optional `Add` button.
 *
 * Supports both controlled (`isOpen` + `onToggle`) and uncontrolled
 * (`defaultOpen`) modes — props are mutually exclusive and the controlled
 * pair wins when supplied. Sections accept any `color` for branding (each
 * feature picks its own accent).
 */
export function PropSection({
  label,
  color = "#2563eb",
  icon,
  children,
  defaultOpen = true,
  onAdd,
  addLabel,
  isOpen,
  onToggle,
}: {
  label: string;
  color?: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  onAdd?: () => void;
  addLabel?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const handleToggle = () => {
    if (onToggle) onToggle();
    else setInternalOpen(o => !o);
  };

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 0 5px",
          marginBottom: open ? 6 : 0,
          cursor: "pointer",
          borderBottom: `1.5px solid ${color}1a`,
        }}
        onClick={handleToggle}
      >
        <div style={{ width: 3, height: 13, background: color, borderRadius: 2, flexShrink: 0 }} />
        {icon && <span style={{ color, display: "flex" }}>{icon}</span>}
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: T.text,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            flex: 1,
          }}
        >
          {label}
        </span>
        {onAdd && (
          <button
            onClick={e => { e.stopPropagation(); onAdd(); }}
            style={{
              background: color + "18",
              border: `1px solid ${color}44`,
              color,
              fontSize: 8.5,
              padding: "2px 7px",
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
        <span style={{ color: T.muted, display: "flex" }}>
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}
