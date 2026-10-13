import { Badge } from "@/components/ui/badge";
import { CommandInput } from "@/components/ui/command";

interface SearchInputBarProps {
  userHasCommandLine: boolean;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  filteredCount: number;
  totalCount: number;
  onExecuteRawInput: (raw: string) => void;
}

export function SearchInputBar({
  userHasCommandLine,
  searchQuery,
  onSearchQueryChange,
  filteredCount,
  totalCount,
  onExecuteRawInput,
}: SearchInputBarProps) {
  return (
    <div className="relative">
      <CommandInput
        placeholder={
          userHasCommandLine
            ? "Type command (e.g. ACCOUNT I F3, INQ S GET.EMP.INFO) or search..."
            : "Search navigation menus & screens..."
        }
        value={searchQuery}
        onValueChange={onSearchQueryChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && searchQuery.trim()) {
            e.preventDefault();
            onExecuteRawInput(searchQuery);
          }
        }}
      />
      {/* Count badge overlay on the full right edge */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-20">
        <Badge
          variant="secondary"
          className="font-mono text-[10px] px-1.5 py-0.5 bg-muted/80 text-muted-foreground border border-border/40 shadow-none font-medium"
        >
          {filteredCount}/{totalCount}
        </Badge>
      </div>
    </div>
  );
}
