import { AlertCircle, Terminal } from "lucide-react";
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import type { ControlCommand } from "@/lib/data-schemas";
import { CommandItemRow } from "./command-item-row";

interface SearchResultsListProps {
  categories: [string, ControlCommand[]][];
  onSelectCommand: (cmd: ControlCommand) => void;
  rawCommandInput?: string | null;
  syntaxError?: string | null;
  onExecuteRawInput?: (raw: string) => void;
}

export function SearchResultsList({
  categories,
  onSelectCommand,
  rawCommandInput,
  syntaxError,
  onExecuteRawInput,
}: SearchResultsListProps) {
  return (
    <CommandList className="max-h-72">
      {syntaxError && categories.length === 0 && !rawCommandInput ? (
        <div className="py-3 px-3 m-2 text-xs border border-destructive/30 bg-destructive/5 rounded-md flex items-start gap-2 text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-semibold text-2xs uppercase tracking-wide">
              Invalid Command Syntax
            </span>
            <span className="text-muted-foreground text-2xs leading-relaxed">{syntaxError}</span>
          </div>
        </div>
      ) : (
        <CommandEmpty className="py-6 text-xs text-muted-foreground">
          No commands or screens found.
        </CommandEmpty>
      )}

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
            <span className="ml-2 font-mono text-3xs sm:text-2xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-md border border-primary/20 truncate max-w-[55%]">
              {rawCommandInput.toUpperCase()}
            </span>
          </CommandItem>
        </CommandGroup>
      )}
    </CommandList>
  );
}
