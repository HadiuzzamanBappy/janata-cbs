import { PanelLeft, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface InspectorHeaderProps {
  title?: string;
  subtitle?: string;
  fallbackTitle?: string;
  indexBadge: number | string;
  showSidebarToggle?: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  toggleTooltip?: string;
  onDelete?: () => void;
  deleteTooltip?: string;
  disabled?: boolean;
}

export function InspectorHeader({
  title,
  subtitle,
  fallbackTitle = "<UNNAMED>",
  indexBadge,
  showSidebarToggle = false,
  isSidebarOpen = false,
  onToggleSidebar,
  toggleTooltip,
  onDelete,
  deleteTooltip = "Delete Item",
  disabled = false,
}: InspectorHeaderProps) {
  const resolvedToggleTooltip = toggleTooltip || (isSidebarOpen ? "Hide List" : "Show List");

  return (
    <div className="px-3 py-1.5 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
      <div className="flex items-center gap-1.5 min-w-0">
        {showSidebarToggle && onToggleSidebar && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onToggleSidebar}
            className="size-7 text-muted-foreground hover:text-foreground shrink-0 mr-0.5"
            title={resolvedToggleTooltip}
          >
            <PanelLeft className="size-3.5" />
          </Button>
        )}

        {title && subtitle && title !== subtitle ? (
          <>
            <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide truncate">
              {title}
            </span>
            <span className="text-xs text-muted-foreground truncate font-mono">— {subtitle}</span>
          </>
        ) : (
          <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide truncate">
            {title || subtitle || fallbackTitle}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Badge
          variant="outline"
          className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/25 shadow-2xs shrink-0"
        >
          {typeof indexBadge === "number" ? `#${indexBadge + 1}` : indexBadge}
        </Badge>

        {!disabled && onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onDelete}
            className="size-7 text-destructive hover:bg-destructive/10 rounded cursor-pointer"
            title={deleteTooltip}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
