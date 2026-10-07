import { Copy, Eye, EyeOff, Lock, Trash2, Unlock, Upload } from "lucide-react";
import {
  ContextMenuDivider,
  ContextMenuItem,
  ContextMenuShell,
} from "../../components/common/ContextMenu";
import type { BodyCtxMenu } from "../../types/app-state";

/**
 * Right-click menu for body components on the canvas.
 *
 * Like `ZoneContextMenu`, the chrome lives in `components/common/`; this
 * file owns only the item list and the IMAGE-specialised "Upload image…"
 * entry.
 */
export function BodyContextMenu({
  menu,
  onClose,
  onDelete,
  onDuplicate,
  onHide,
  onLock,
  onUploadImage,
  isHidden,
  isLocked,
}: {
  menu: BodyCtxMenu;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onHide: () => void;
  onLock: () => void;
  onUploadImage?: () => void;
  isHidden: boolean;
  isLocked: boolean;
}) {
  return (
    <ContextMenuShell x={menu.x} y={menu.y} onClose={onClose} minWidth={170}>
      {menu.compType === "IMAGE" && onUploadImage && (
        <>
          <ContextMenuItem
            icon={<Upload size={12} />}
            label="Upload image..."
            onClick={onUploadImage}
            onClose={onClose}
          />
          <ContextMenuDivider />
        </>
      )}
      <ContextMenuItem
        icon={<Copy size={12} />}
        label="Duplicate"
        onClick={onDuplicate}
        onClose={onClose}
      />
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
      <ContextMenuItem
        icon={<Trash2 size={12} />}
        label="Delete"
        onClick={onDelete}
        onClose={onClose}
        danger
        shortcut="Del"
      />
    </ContextMenuShell>
  );
}
