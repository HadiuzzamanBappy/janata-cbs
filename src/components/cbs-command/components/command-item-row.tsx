import { BarChart3, FileSpreadsheet, FileText, Search, Settings, Sliders } from "lucide-react";
import { CommandItem } from "@/components/ui/command";
import type { CommandItemRowProps } from "../types";

export function CommandItemRow({ cmd, category, onSelect }: CommandItemRowProps) {
  // Resolve icon dynamically based on controlType & controlAction
  let IconComp = FileText;
  if (cmd.controlAction === "SETTINGS" || cmd.controlType === "SETTINGS") {
    IconComp = Settings;
  } else if (cmd.controlType === "INQUIRY") {
    IconComp = Search;
  } else if (cmd.controlType === "REPORT") {
    IconComp = BarChart3;
  } else if (category.includes("System") || cmd.command.startsWith("SC.")) {
    IconComp = Sliders;
  } else if (cmd.controlType === "FORM") {
    IconComp = FileSpreadsheet;
  }

  const distinctAliases = (cmd.aliases || []).filter((alias) => alias !== cmd.command);

  return (
    <CommandItem
      key={cmd.command}
      value={cmd.command}
      onSelect={() => onSelect(cmd)}
      className="group flex items-center justify-between py-1.5 px-2.5 cursor-pointer"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <IconComp className="size-3.5" />
        </div>
        <span className="font-medium text-xs truncate group-data-[selected=true]:text-accent-foreground">
          {cmd.title}
        </span>
      </div>

      <div
        data-slot="command-shortcut"
        className="ml-2 flex items-center gap-1.5 shrink-0 max-w-[45%] overflow-hidden"
      >
        {distinctAliases.map((alias) => (
          <span
            key={alias}
            className="font-mono text-[10px] sm:text-[11px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-md border border-primary/20 shrink-0"
          >
            {alias}
          </span>
        ))}
        <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/40 truncate">
          {cmd.command}
        </span>
      </div>
    </CommandItem>
  );
}
