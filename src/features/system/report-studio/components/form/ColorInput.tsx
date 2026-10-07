import { ChevronDown } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { T } from "../../theme/tokens";
import { isValidHex } from "../../utils/color";
import { ColorPickerPopup } from "./ColorPickerPopup";

/**
 * Label + colour swatch + hex chip + dropdown that opens a fixed-position
 * `ColorPickerPopup` clamped to the viewport.
 *
 * Implementation notes preserved from the monolith:
 *  - The popup uses `position: fixed` and is positioned manually after
 *    reading the trigger's `getBoundingClientRect()`. This avoids ancestor
 *    `overflow: hidden` clipping the picker.
 *  - The popup prefers opening ABOVE the trigger; falls back to below, then
 *    to the bottom of the viewport.
 *  - Outside-click and `scroll` close it. The `scroll` listener uses
 *    capture-phase so it fires for nested scrollable ancestors too.
 */
export function ColorInput({
  label,
  value,
  onChange,
}: {
  label?: ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const openPicker = () => {
    if (!triggerRef.current) {
      setOpen((o) => !o);
      return;
    }
    const r = triggerRef.current.getBoundingClientRect();
    const POPUP_W = 260;
    const POPUP_H = 320; // approx picker height
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = r.left;
    if (left + POPUP_W > vw - 8) left = vw - POPUP_W - 8;
    if (left < 8) left = 8;

    let top: number;
    if (r.top - POPUP_H - 6 >= 8) {
      top = r.top - POPUP_H - 6;
    } else if (r.bottom + POPUP_H + 6 <= vh - 8) {
      top = r.bottom + 6;
    } else {
      top = Math.max(8, vh - POPUP_H - 8);
    }

    setPopupStyle({
      position: "fixed",
      left,
      top,
      zIndex: 99999,
      boxShadow: "0 8px 32px rgba(0,0,0,.28)",
      borderRadius: 10,
    });
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const inTrigger = triggerRef.current?.contains(e.target as Node);
      const inPopup = popupRef.current?.contains(e.target as Node);
      if (!inTrigger && !inPopup) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const safeVal = isValidHex(value) ? value : "#000000";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
        position: "relative",
      }}
    >
      {label && (
        <span style={{ fontSize: 9.5, color: T.label, minWidth: 80, flexShrink: 0 }}>{label}</span>
      )}
      <div
        ref={triggerRef}
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          flex: 1,
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: T.radius,
          padding: "3px 8px 3px 4px",
          cursor: "pointer",
        }}
        onClick={openPicker}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            background: safeVal,
            border: "1px solid rgba(0,0,0,.1)",
            flexShrink: 0,
          }}
        />
        <span style={{ fontFamily: "monospace", fontSize: 10.5, color: T.text, flex: 1 }}>
          {safeVal}
        </span>
        <ChevronDown size={11} color={T.muted} />
      </div>
      {open && (
        <div ref={popupRef} style={popupStyle}>
          <ColorPickerPopup hex={safeVal} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
