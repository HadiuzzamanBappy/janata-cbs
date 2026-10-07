import { Compass, Layers, Settings, ShieldCheck, Sliders, Terminal } from "lucide-react";
import { CommandItem } from "@/components/ui/command";
import type { CommandItemRowProps } from "../types";

export function CommandItemRow({ cmd, category, onSelect }: CommandItemRowProps) {
  // Resolve icon
  let IconComp = Layers;
  if (cmd.category === "Preferences") {
    IconComp = Settings;
  } else if (cmd.category === "Security & Authentication") {
    IconComp = ShieldCheck;
  } else if (cmd.category === "Quick Actions") {
    IconComp = Terminal;
  } else if (category.includes("System") || category.includes("Control")) {
    IconComp = Sliders;
  } else if (category.includes("Navigation") || category.includes("Operation")) {
    IconComp = Compass;
  }

  // 1 short alias tag (if provided)
  const aliasTag = cmd.aliases && cmd.aliases.length > 0 ? cmd.aliases[0] : undefined;
  const searchValue = [cmd.title, aliasTag, cmd.command].filter(Boolean).join(" ");

  return (
    <CommandItem
      key={cmd.id}
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
        {aliasTag && (
          <span className="font-mono text-[11px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
            {aliasTag}
          </span>
        )}
        <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40">
          {cmd.command}
        </span>
      </div>
    </CommandItem>
  );
}
