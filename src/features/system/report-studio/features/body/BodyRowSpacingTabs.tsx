import { Frame, Maximize2 } from "lucide-react";
import { useState } from "react";
import { SpacingInput } from "../../components/form/SpacingInput";
import { T } from "../../theme/tokens";
import type { Spacing } from "../../types/primitives";

/**
 * Margin / Padding tab pair for `BodyRowPropsPanel`. Parallel to
 * `BodyLayoutSpacingTabs` (used by the component-level layout section) but
 * kept separate per migration note — the two callers pass different default
 * colours and may diverge if either evolves.
 */
export function BodyRowSpacingTabs({
  mg,
  pad,
  onUpdateMargin,
  onUpdatePadding,
  color,
}: {
  mg: Spacing;
  pad: Spacing;
  onUpdateMargin: (v: Spacing) => void;
  onUpdatePadding: (v: Spacing) => void;
  color: string;
}) {
  const [activeTab, setActiveTab] = useState<"margin" | "padding">("margin");
  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 3,
          marginBottom: 8,
          background: T.bg2,
          padding: 3,
          borderRadius: 6,
          border: `1px solid ${T.border}`,
        }}
      >
        <button
          onClick={() => setActiveTab("margin")}
          style={{
            flex: 1,
            padding: "5px 8px",
            fontSize: 9,
            fontWeight: 700,
            color: activeTab === "margin" ? "#fff" : T.muted,
            background: activeTab === "margin" ? color : "transparent",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Frame size={9} />
          Margin
        </button>
        <button
          onClick={() => setActiveTab("padding")}
          style={{
            flex: 1,
            padding: "5px 8px",
            fontSize: 9,
            fontWeight: 700,
            color: activeTab === "padding" ? "#fff" : T.muted,
            background: activeTab === "padding" ? "#059669" : "transparent",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Maximize2 size={9} />
          Padding
        </button>
      </div>
      {activeTab === "margin" && (
        <SpacingInput label="Margin" value={mg} onChange={onUpdateMargin} color={color} />
      )}
      {activeTab === "padding" && (
        <SpacingInput label="Padding" value={pad} onChange={onUpdatePadding} color="#059669" />
      )}
    </>
  );
}
