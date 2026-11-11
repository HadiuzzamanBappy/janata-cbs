import { Terminal } from "lucide-react";
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import type { ControlCommand } from "@/lib/data-schemas";
import { CommandItemRow } from "./command-item-row";

interface SearchResultsListProps {
  categories: [string, ControlCommand[]][];
  onSelectCommand: (cmd: ControlCommand) => void;
  rawCommandInput?: string | null;
  onExecuteRawInput?: (raw: string) => void;
}

export function SearchResultsList({
  categories,
  onSelectCommand,
  rawCommandInput,
  onExecuteRawInput,
}: SearchResultsListProps) {
  return (
    <CommandList className="max-h-72">
      <CommandEmpty className="py-6 text-xs text-muted-foreground">
        No commands or screens found.
      </CommandEmpty>

      {categories.map(([category, items]) => (
        <CommandGroup key={category} heading={category}>
          {items.map((cmd) => (
            <CommandItemRow
              key={cmd.command}
              cmd={cmd}
              category={category}
              onSelect={onSelectCommand}
            />
          ))}
        </CommandGroup>
      ))}

      {categories.length === 0 && rawCommandInput && onExecuteRawInput && (
        <CommandGroup heading="Terminal Command">
          <CommandItem
            key={`exec:${rawCommandInput}`}
            value={`__exec__:${rawCommandInput}`}
            onSelect={() => onExecuteRawInput(rawCommandInput)}
            className="group flex items-center justify-between py-1.5 px-2.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Terminal className="size-3.5" />
              </div>
              <span className="font-medium text-xs truncate">Execute Command</span>
            </div>
            <span className="ml-2 font-mono text-[10px] sm:text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md border border-primary/20 truncate max-w-[55%]">
              {rawCommandInput.toUpperCase()}
            </span>
          </CommandItem>
        </CommandGroup>
      )}
    </CommandList>
  );
}
