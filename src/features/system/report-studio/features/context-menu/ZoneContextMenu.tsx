import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Lock, Trash2, Unlock, Upload } from "lucide-react";
import type { CtxMenu } from "../../types/app-state";
import {
  ContextMenuDivider,
  ContextMenuItem,
  ContextMenuShell,
} from "../../components/common/ContextMenu";

/**
 * Right-click menu for elements inside header / footer zones.
 *
 * The chrome (viewport-clamp, close-on-outside-click) is in
 * `components/common/ContextMenu/`. This file owns only the item list and
 * the LOGO-specific "Upload image…" entry that the monolith specialised on
 * `menu.elType === "LOGO"`.
 */
export function ZoneContextMenu({
  menu,
  onClose,
  onHide,
  onLock,
  onDuplicate,
  onDelete,
  onZOrder,
  onUploadLogo,
  isHidden,
  isLocked,
}: {
  menu: CtxMenu;
  onClose: () => void;
  onHide: () => void;
  onLock: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onZOrder: (d: "up" | "down") => void;
  onUploadLogo?: () => void;
  isHidden: boolean;
  isLocked: boolean;
}) {
  return (
    <ContextMenuShell x={menu.x} y={menu.y} onClose={onClose} minWidth={160}>
      {menu.elType === "LOGO" && onUploadLogo && (
        <>
          <ContextMenuItem icon={<Upload size={12} />} label="Upload image…" onClick={onUploadLogo} onClose={onClose} />
          <ContextMenuDivider />
        </>
      )}
      <ContextMenuItem icon={<Copy size={12} />} label="Duplicate" onClick={onDuplicate} onClose={onClose} />
      <ContextMenuItem
        icon={isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
        label={isHidden ? "Show" : "Hide"}
        onClick={onHide}
        onClose={onClose}
      />
      <ContextMenuItem
        icon={isLocked ? <Unlock size={12} /> : <Lock size={12} />}
        label={isLocked ? "Unlock" : "Lock"}
        onClick={onLock}
        onClose={onClose}
      />
      <ContextMenuDivider />
      <ContextMenuItem icon={<ArrowUp size={12} />} label="Bring Forward" onClick={() => onZOrder("up")} onClose={onClose} />
      <ContextMenuItem icon={<ArrowDown size={12} />} label="Send Back" onClick={() => onZOrder("down")} onClose={onClose} />
      <ContextMenuDivider />
      <ContextMenuItem icon={<Trash2 size={12} />} label="Delete" onClick={onDelete} onClose={onClose} danger />
    </ContextMenuShell>
  );
}
