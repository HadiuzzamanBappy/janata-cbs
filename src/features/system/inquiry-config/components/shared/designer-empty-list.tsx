import type { LucideIcon } from "lucide-react";

export interface DesignerEmptyListProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function DesignerEmptyList({ icon: Icon, title, description }: DesignerEmptyListProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground select-none">
      <Icon className="size-8 text-muted-foreground/30 mb-2" />
      <p className="text-xs font-medium">{title}</p>
      <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-50">{description}</p>
    </div>
  );
}
