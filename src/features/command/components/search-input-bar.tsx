import { Badge } from "@/components/ui/badge";
import { CommandInput } from "@/components/ui/command";

interface SearchInputBarProps {
  userHasCommandLine: boolean;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  filteredCount: number;
  totalCount: number;
}

export function SearchInputBar({
  userHasCommandLine,
  searchQuery,
  onSearchQueryChange,
  filteredCount,
  totalCount,
}: SearchInputBarProps) {
  return (
    <div className="relative">
      <CommandInput
        placeholder={
          userHasCommandLine ? "Type command or search..." : "Search navigation menus & screens..."
        }
        className="pr-16 text-xs sm:text-sm"
        value={searchQuery}
        onValueChange={onSearchQueryChange}
      />
      {/* Count badge overlay on the right edge */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-20 hidden xs:flex">
        <Badge
          variant="secondary"
          className="font-mono text-[10px] px-1.5 py-0.5 bg-muted/90 text-muted-foreground border border-border/40 shadow-none font-medium"
        >
          {filteredCount}/{totalCount}
        </Badge>
      </div>
    </div>
  );
}
