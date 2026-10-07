import { useRef, useState } from "react";
import { hexToHsv, hsvToHex, isValidHex } from "../../utils/color";

/**
 * 200px colour picker — SV pad + hue bar + hex input.
 *
 * Behaviour preserved from the monolith:
 *   - SV pad and hue bar are dragged using `mousedown` + `mousemove` window
 *     listeners (releases on `mouseup`). This works while the cursor leaves
 *     the bar — important because users often drag faster than the bar's
 *     bounding rect.
 *   - When the parent passes a new `hex` (undo, theme change) the picker
 *     mirrors it without losing focus. We do the sync inside render rather
 *     than in `useEffect` to avoid a flicker frame.
 *   - Hex input accepts any text — only triggers `onChange` when the typed
 *     value is a valid 6-digit hex.
 */
export function ColorPickerPopup({
  hex,
  onChange,
}: {
  hex: string;
  onChange: (h: string) => void;
}) {
  const [hsv, setHsv] = useState<[number, number, number]>(() =>
    hexToHsv(isValidHex(hex) ? hex : "#2563eb"),
  );
  const [textVal, setTextVal] = useState(hex);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  // Sync if parent hex changes (undo/theme). Performed in render — the
  // monolith does the same; switching to useEffect would add a paint frame.
  const lastHex = useRef(hex);
  if (hex !== lastHex.current && isValidHex(hex)) {
    lastHex.current = hex;
    const newHsv = hexToHsv(hex);
    setHsv(newHsv);
    setTextVal(hex);
  }

  const emit = (newHsv: [number, number, number]) => {
    const h = hsvToHex(...newHsv);
    lastHex.current = h;
    setTextVal(h);
    onChange(h);
  };

  const onSvDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const move = (me: MouseEvent) => {
      const r = svRef.current!.getBoundingClientRect();
      const s = Math.round(Math.max(0, Math.min(1, (me.clientX - r.left) / r.width)) * 100);
      const v = Math.round(Math.max(0, Math.min(1, 1 - (me.clientY - r.top) / r.height)) * 100);
      const next: [number, number, number] = [hsv[0], s, v];
      setHsv(next);
      emit(next);
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    move(e.nativeEvent);
  };

  const onHueDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const move = (me: MouseEvent) => {
      const r = hueRef.current!.getBoundingClientRect();
      const hue = Math.round(Math.max(0, Math.min(1, (me.clientX - r.left) / r.width)) * 360);
      const next: [number, number, number] = [hue, hsv[1], hsv[2]];
      setHsv(next);
      emit(next);
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    move(e.nativeEvent);
  };

  const svBg = `hsl(${hsv[0]},100%,50%)`;
  const thumbL = `${hsv[1]}%`;
  const thumbT = `${100 - hsv[2]}%`;
  const hueL = `${(hsv[0] / 360) * 100}%`;

  return (
    <div
      style={{
        width: 200,
        padding: 10,
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,.22)",
        userSelect: "none",
      }}
    >
      <div
        ref={svRef}
        onMouseDown={onSvDown}
        style={{
          width: "100%",
          height: 140,
          borderRadius: 6,
          position: "relative",
          cursor: "crosshair",
          marginBottom: 10,
          background: `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,${svBg})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: thumbL,
            top: thumbT,
            transform: "translate(-50%,-50%)",
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "2px solid #fff",
            boxShadow: "0 0 0 1px rgba(0,0,0,.4)",
            pointerEvents: "none",
            background: hsvToHex(...hsv),
          }}
        />
      </div>
      <div
        ref={hueRef}
        onMouseDown={onHueDown}
        style={{
          width: "100%",
          height: 14,
          borderRadius: 7,
          position: "relative",
          cursor: "crosshair",
          marginBottom: 10,
          background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: hueL,
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid #fff",
            boxShadow: "0 0 0 1px rgba(0,0,0,.4)",
            pointerEvents: "none",
            background: `hsl(${hsv[0]},100%,50%)`,
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            flexShrink: 0,
            border: "1px solid #e2e8f0",
            background: hsvToHex(...hsv),
          }}
        />
        <input
          value={textVal}
          onChange={(e) => {
            setTextVal(e.target.value);
            if (isValidHex(e.target.value)) {
              const nh = hexToHsv(e.target.value);
              setHsv(nh);
              emit(nh);
            }
          }}
          style={{
            flex: 1,
            fontFamily: "monospace",
            fontSize: 11,
            padding: "4px 7px",
            border: "1px solid #e2e8f0",
            borderRadius: 5,
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}
