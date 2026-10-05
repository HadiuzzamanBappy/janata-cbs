/**
 * Generic context-menu shell extracted from the monolith's `ContextMenu` and
 * `BodyContextMenu` — both menus share the same viewport-clamping fixed
 * positioning, `window mousedown` close behaviour, and item-row styling.
 *
 * The feature-specific menus (Zone-element menu, Body-component menu) live
 * in `features/context-menu/` (Phase 3) and compose these shells.
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";

export { ContextMenuShell, ContextMenuItem, ContextMenuDivider };

/**
 * Fixed-position card that clamps inside the viewport.
 *
 * The shell starts with `visibility: hidden` so we can measure the rendered
 * box, then flip-positions and unhides in `useLayoutEffect`. This prevents
 * the "appears off-screen for one frame" flash the naive implementation
 * suffers from.
 *
 * Closes itself on any `mousedown` outside — `onClose` runs once per click.
 */
function ContextMenuShell({
  x,
  y,
  onClose,
  children,
  minWidth = 160,
}: {
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
  minWidth?: number;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
    // onClose intentionally ignored — the monolith uses a one-time listener
    // and re-binding would interfere with the existing render flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { width: mw, height: mh } = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 8;
    // Prefer opening right+down from click; flip if it would overflow.
    const fx = x + mw + pad > vw ? x - mw : x;
    const fy = y + mh + pad > vh ? y - mh : y;
    el.style.left = Math.max(pad, Math.min(fx, vw - mw - pad)) + "px";
    el.style.top = Math.max(pad, Math.min(fy, vh - mh - pad)) + "px";
    el.style.visibility = "visible";
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        visibility: "hidden",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,.18)",
        zIndex: 9999,
        minWidth,
        padding: "4px 0",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

/** One row inside a context menu. Reusable across the two feature menus. */
function ContextMenuItem({
  icon,
  label,
  onClick,
  onClose,
  danger,
  shortcut,
}: {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  /** Optional — when provided, the row closes the menu after firing. */
  onClose?: () => void;
  danger?: boolean;
  shortcut?: string;
}) {
  return (
    <div
      onMouseDown={e => {
        e.stopPropagation();
        onClick();
        onClose?.();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        cursor: "pointer",
        fontSize: 11,
        color: danger ? "#dc2626" : "#1e293b",
        borderRadius: 4,
        justifyContent: shortcut ? "space-between" : "flex-start",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? "#fee2e2" : "#f1f5f9")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        {label}
      </span>
      {shortcut && (
        <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>
          {shortcut}
        </span>
      )}
    </div>
  );
}

/** Thin separator between groups of context-menu items. */
function ContextMenuDivider() {
  return <div style={{ borderTop: "1px solid #f1f5f9", margin: "3px 0" }} />;
}
