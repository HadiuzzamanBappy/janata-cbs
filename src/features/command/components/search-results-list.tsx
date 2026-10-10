import { CommandEmpty, CommandGroup, CommandList } from "@/components/ui/command";
import type { SystemCommandItem } from "@/lib/data-schemas";
import { CommandItemRow } from "./command-item-row";

interface SearchResultsListProps {
  categories: [string, SystemCommandItem[]][];
  onSelectCommand: (cmd: SystemCommandItem) => void;
}

export function SearchResultsList({ categories, onSelectCommand }: SearchResultsListProps) {
  return (
    <CommandList className="max-h-72">
      <CommandEmpty className="py-6 text-xs text-muted-foreground">
        No commands or screens found.
      </CommandEmpty>

      {categories.map(([category, items]) => (
        <CommandGroup key={category} heading={category}>
          {items.map((cmd) => (
            <CommandItemRow key={cmd.id} cmd={cmd} category={category} onSelect={onSelectCommand} />
          ))}
        </CommandGroup>
      ))}
    </CommandList>
  );
}
