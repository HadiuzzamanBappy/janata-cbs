import { Compass, Layers, Settings, Sliders, Terminal } from "lucide-react";
import { CommandItem } from "@/components/ui/command";
import type { CommandItemRowProps } from "../types";

export function CommandItemRow({ cmd, category, onSelect }: CommandItemRowProps) {
  // Resolve icon
  let IconComp = Layers;
  if (cmd.actionType === "SETTINGS") {
    IconComp = Settings;
  } else if (cmd.actionType === "THEME" || cmd.actionType === "LOGOUT") {
    IconComp = Terminal;
  } else if (category.includes("System") || cmd.command.startsWith("SC.")) {
    IconComp = Sliders;
  } else {
    IconComp = Compass;
  }

  // Search value indexing: includes title, all aliases, and canonical command
  const distinctAliases = (cmd.aliases || []).filter((alias) => alias !== cmd.command);
  const searchValue = [cmd.title, ...distinctAliases, cmd.command].filter(Boolean).join(" ");

  return (
    <CommandItem
      key={cmd.command}
      value={searchValue}
      onSelect={() => onSelect(cmd)}
      className="group flex items-center justify-between py-1.5 px-2.5 cursor-pointer"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <IconComp className="size-3.5" />
        </div>
        <span className="font-medium text-xs truncate group-data-[selected=true]:text-accent-foreground">
          {cmd.title}
        </span>
      </div>

      <div data-slot="command-shortcut" className="ml-auto flex items-center gap-1.5 shrink-0 pl-2">
        {distinctAliases.map((alias) => (
          <span
            key={alias}
            className="font-mono text-[11px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-md border border-primary/20"
          >
            {alias}
          </span>
        ))}
        <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/40">
          {cmd.command}
        </span>
      </div>
    </CommandItem>
  );
}
