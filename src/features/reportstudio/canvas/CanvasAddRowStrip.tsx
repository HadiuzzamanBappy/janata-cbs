import { useState } from "react";
import { Plus } from "@/features/reportstudio/theme/icons";

export function CanvasAddRowStrip({
  scale,
  onAddRow,
}: {
  scale: number;
  onAddRow: (cols: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cols, setCols] = useState(1);
  const toPx = (v: number) => Math.round(v * scale);
  return (
    <div style={{ marginTop: toPx(6) }} onClick={(e) => e.stopPropagation()}>
      {!open ? (
        <div
          onClick={() => setOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: toPx(5),
            height: toPx(22),
            borderRadius: 5,
            border: "1.5px dashed #a7f3d0",
            background: "#f0fdf4",
            cursor: "pointer",
            transition: "all .15s",
          }}
        >
          <Plus size={toPx(9)} color="#059669" strokeWidth={2.5} />
          <span
            style={{ fontSize: toPx(8), color: "#059669", fontWeight: 700 }}
          >
            Add Row
          </span>
        </div>
      ) : (
        <div
          style={{
            background: "#f0fdf4",
            border: "1.5px solid #a7f3d0",
            borderRadius: 8,
            padding: toPx(8),
          }}
        >
          <div
            style={{
              fontSize: toPx(8),
              fontWeight: 700,
              color: "#059669",
              marginBottom: toPx(5),
            }}
          >
            New row — columns:
          </div>
          <div style={{ display: "flex", gap: toPx(4), marginBottom: toPx(6) }}>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setCols(n)}
                style={{
                  flex: 1,
                  padding: `${toPx(5)}px 0`,
                  borderRadius: 5,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: toPx(10),
                  border: `2px solid ${cols === n ? "#059669" : "#d1fae5"}`,
                  background: cols === n ? "#059669" : "#fff",
                  color: cols === n ? "#fff" : "#059669",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: toPx(4) }}>
            <button
              onClick={() => {
                onAddRow(cols);
                setOpen(false);
                setCols(1);
              }}
              style={{
                flex: 1,
                padding: `${toPx(5)}px 0`,
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
                fontSize: toPx(9),
                fontWeight: 700,
              }}
            >
              Create ↵
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: `${toPx(4)}px ${toPx(8)}px`,
                background: "#fff",
                border: "1px solid #d1fae5",
                borderRadius: 5,
                cursor: "pointer",
                fontSize: toPx(8),
                color: "#64748b",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
