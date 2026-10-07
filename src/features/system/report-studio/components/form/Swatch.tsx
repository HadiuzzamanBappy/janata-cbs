import { type CSSProperties, useEffect, useRef, useState } from "react";
import { isValidHex } from "../../utils/color";
import { ColorPickerPopup } from "./ColorPickerPopup";

/**
 * Tiny 18×18 colour swatch that opens the same fixed-position picker as
 * `ColorInput`, but without the label/chip chrome.
 *
 * Used by the conditional-formatting rows where space is at a premium and
 * by the variable-style editor's inline highlight/background pickers.
 *
 * When `checkerboard` is true the empty state shows a checkerboard pattern
 * so users can tell "no colour" apart from "white".
 */
export function Swatch({
  value,
  onChange,
  title,
  checkerboard,
}: {
  value: string;
  onChange: (v: string) => void;
  title?: string;
  checkerboard?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const openPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!triggerRef.current) {
      setOpen((o) => !o);
      return;
    }
    const r = triggerRef.current.getBoundingClientRect();
    const POPUP_W = 220;
    const POPUP_H = 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = r.left;
    if (left + POPUP_W > vw - 8) left = vw - POPUP_W - 8;
    if (left < 8) left = 8;
    let top = r.top - POPUP_H - 6;
    if (top < 8) top = r.bottom + 6;
    if (top + POPUP_H > vh - 8) top = Math.max(8, vh - POPUP_H - 8);
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
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !popupRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onScroll = () => setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const safeVal = isValidHex(value) ? value : "";
  const bgStyle: CSSProperties = safeVal
    ? { background: safeVal }
    : {
        background: checkerboard
          ? "repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 0 0/8px 8px"
          : "#f1f5f9",
      };

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div
        ref={triggerRef}
        onClick={openPicker}
        title={title}
        style={{
          width: 18,
          height: 18,
          borderRadius: 3,
          cursor: "pointer",
          border: `1.5px solid ${open ? "#dc2626" : "#e2e8f0"}`,
          boxSizing: "border-box",
          ...bgStyle,
        }}
      />
      {open && (
        <div ref={popupRef} style={popupStyle}>
          <ColorPickerPopup hex={safeVal || "#ffffff"} onChange={(v) => onChange(v)} />
        </div>
      )}
    </div>
  );
}
