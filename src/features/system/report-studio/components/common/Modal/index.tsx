/**
 * Modal shell extracted from the recurring pattern across the monolith's four
 * modal-shaped components: `PdfPreviewModal`, `TemplateModal`,
 * `JsonExportModal`, `ImportJsonModal`. They share:
 *
 *  - Fixed full-viewport overlay with rgba(0,0,0,.45) backdrop.
 *  - Centred panel with rounded corners and a thick shadow.
 *  - Header strip with title + close button.
 *  - Body slot that scrolls vertically.
 *  - Optional footer strip.
 *
 * Pulling the chrome up here removes ~120 lines of duplicated JSX across the
 * four feature modals in Phase 3 / Phase 4. Feature modals still own their
 * body content; they just stop redrawing the chrome.
 */

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { T } from "../../../theme/tokens";

export { Modal, ModalHeader, ModalBody, ModalFooter };

function Modal({
  open,
  onClose,
  children,
  width = 720,
  height,
  closeOnBackdrop = true,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number | string;
  height?: number | string;
  closeOnBackdrop?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onMouseDown={closeOnBackdrop ? onClose : undefined}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          width,
          maxWidth: "92vw",
          height,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          background: T.bg,
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          boxShadow: "0 16px 48px rgba(0,0,0,.32)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  onClose,
  right,
}: {
  title: ReactNode;
  onClose?: () => void;
  /** Optional right-aligned controls between title and close button. */
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderBottom: `1px solid ${T.border}`,
        background: T.bg2,
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1 }}>
        {title}
      </div>
      {right}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: T.muted,
            display: "flex",
            alignItems: "center",
            padding: 4,
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function ModalBody({
  children,
  padded = true,
}: {
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: padded ? "14px 16px" : 0,
        background: T.bg,
      }}
    >
      {children}
    </div>
  );
}

function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderTop: `1px solid ${T.border}`,
        background: T.bg2,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}
