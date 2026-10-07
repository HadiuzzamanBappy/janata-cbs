import { Copy, EyeOff, Lock, Trash2, Unlock } from "lucide-react";
import { Toggle } from "../../components/common/Toggle";
import { inputStyle } from "../../theme/inputStyle";
import { T } from "../../theme/tokens";
import type { BodyComponent } from "../../types/body";

/**
 * Header strip at the top of every body-component props panel: icon + label
 * input + duplicate / lock / delete buttons + hidden toggle.
 *
 * Identical structure across all four component-type panels (CHART, IMAGE,
 * TABLE, TEXT_BLOCK); only the `color` and `Icon` differ — passed in by the
 * caller from `BODY_COMP_META`.
 */
export function BodyCompHeader({
  comp,
  onUpdate,
  onDelete,
  onDuplicate,
  color,
  Icon,
}: {
  comp: BodyComponent;
  onUpdate: (c: BodyComponent) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  color: string;
  Icon: any;
}) {
  return (
    <div
      style={{
        background: `${color}09`,
        border: `1px solid ${color}22`,
        borderRadius: 10,
        padding: "10px 12px",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: `${color}18`,
            border: `1.5px solid ${color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
            flexShrink: 0,
          }}
        >
          <Icon size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            value={comp.label}
            onChange={(e) => onUpdate({ ...comp, label: e.target.value })}
            style={{
              ...inputStyle,
              fontSize: 12,
              fontWeight: 700,
              padding: "2px 6px",
              color: T.text,
              background: "transparent",
              border: "none",
              width: "100%",
              outline: "none",
            }}
          />
          <div style={{ fontSize: 8.5, color: `${color}99`, marginTop: 1 }}>Body Component</div>
        </div>
        {onDuplicate && (
          <button
            onClick={onDuplicate}
            title="Duplicate"
            style={{
              width: 25,
              height: 25,
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              color: "#0891b2",
              borderRadius: 5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Copy size={11} />
          </button>
        )}
        <button
          onClick={() => onUpdate({ ...comp, locked: !comp.locked })}
          title={comp.locked ? "Unlock" : "Lock"}
          style={{
            width: 25,
            height: 25,
            background: comp.locked ? "#fef3c7" : "#f8fafc",
            border: `1px solid ${comp.locked ? "#fcd34d" : "#e2e8f0"}`,
            color: comp.locked ? "#d97706" : "#64748b",
            borderRadius: 5,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {comp.locked ? <Lock size={11} /> : <Unlock size={11} />}
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          style={{
            width: 25,
            height: 25,
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#dc2626",
            borderRadius: 5,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Trash2 size={11} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <Toggle
          label="Hidden"
          icon={<EyeOff size={10} />}
          value={!!comp.hidden}
          onChange={(v) => onUpdate({ ...comp, hidden: v })}
        />
        {comp.locked && (
          <div
            style={{
              fontSize: 8,
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 6px",
              background: "#fef3c7",
              borderRadius: 4,
              border: "1px solid #fcd34d",
            }}
          >
            <Lock size={8} />
            Locked — unlock to edit
          </div>
        )}
      </div>
    </div>
  );
}
