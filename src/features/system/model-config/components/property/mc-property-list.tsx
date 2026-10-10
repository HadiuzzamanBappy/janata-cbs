import { Database, Plus, Search, Trash2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/core-utils";
import type { ModelProperty, ValidationErrorItem } from "@/lib/data-schemas/model-config-schema";
import { PROPERTY_TYPES } from "./mc-property-inspector";

interface McPropertyListProps {
  properties: ModelProperty[];
  selectedSN: string | null;
  onSelectSN: (sn: string) => void;
  isReadOnly: boolean;
  isFieldCommitted?: (sn: string) => boolean;
  validationErrors?: ValidationErrorItem[];
  onAddField: () => string;
  onDeleteField?: (sn: string, forceHardDelete?: boolean) => void;
}

export function McPropertyList({
  properties,
  selectedSN,
  onSelectSN,
  isReadOnly,
  isFieldCommitted,
  validationErrors = [],
  onAddField,
  onDeleteField,
}: McPropertyListProps) {
  const [searchFilter, setSearchFilter] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");

  const handleAddField = () => {
    const newSn = onAddField();
    if (newSn && typeof newSn === "string") {
      onSelectSN(newSn);
    }
  };

  const filteredProperties = React.useMemo(() => {
    return properties.filter((p) => {
      const matchSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.trim().toLowerCase()) ||
        p.label.toLowerCase().includes(searchFilter.trim().toLowerCase()) ||
        p.sn.includes(searchFilter.trim());
      const matchType = typeFilter === "ALL" || p.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [properties, searchFilter, typeFilter]);

  return (
    <div className="w-80 sm:w-96 border-r border-border/70 flex flex-col bg-muted/10 shrink-0 min-h-0">
      {/* Top Search & Filter Bar */}
      <div className="p-2 border-b border-border/70 space-y-1.5 shrink-0 bg-muted/20">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="size-5 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Database className="size-3" />
            </div>
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide truncate">
              Fields
            </span>
            <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold border border-primary/20">
              {properties.length}
            </span>
          </div>

          {!isReadOnly && (
            <Button
              type="button"
              size="sm"
              onClick={handleAddField}
              className="h-7 text-xs gap-1 px-2.5 font-medium rounded shadow-xs shrink-0"
            >
              <Plus className="size-3.5" />
              <span>Add Field</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="size-3 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter fields..."
              className="h-7 text-xs pl-7 pr-2 rounded bg-background border-border/80 focus:bg-background w-full"
            />
          </div>
          <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
            <SelectTrigger
              size="sm"
              className="h-7 text-xs w-24 rounded border-border/80 bg-background shrink-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded">
              <SelectItem value="ALL" className="text-xs rounded">
                All Types
              </SelectItem>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs rounded">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Property Items List (Clean, Flat Column Dictionary) */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-border/30">
        {filteredProperties.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground select-none">
            <p>No fields match</p>
          </div>
        ) : (
          filteredProperties.map((prop) => {
            const isSelected = prop.sn === selectedSN;
            const isCommitted = isFieldCommitted ? isFieldCommitted(prop.sn) : true;
            const isArchived = prop.status === "ARCHIVED";
            const propErrors = validationErrors.filter((e) => e.sn === prop.sn);
            const hasError = propErrors.length > 0;

            return (
              <button
                type="button"
                key={prop.sn}
                onClick={() => onSelectSN(prop.sn)}
                onKeyDown={(e) => e.key === "Enter" && onSelectSN(prop.sn)}
                className={cn(
                  "relative flex items-center justify-between w-full py-1.5 px-2.5 text-left cursor-pointer transition-colors group select-none",
                  hasError && !isSelected && "bg-destructive/5 hover:bg-destructive/10",
                  isSelected
                    ? hasError
                      ? "bg-destructive/10 text-destructive border-l-3 border-l-destructive"
                      : "bg-primary/10 text-primary border-l-3 border-l-primary"
                    : hasError
                      ? "border-l-3 border-l-destructive/80 text-foreground"
                      : "hover:bg-muted/40 text-foreground border-l-3 border-l-transparent",
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0",
                      hasError
                        ? "bg-destructive/20 text-destructive border-destructive/50"
                        : isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border/70",
                    )}
                  >
                    #{prop.sn}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "font-mono text-xs font-semibold truncate leading-tight flex items-center gap-1",
                        isArchived && "line-through text-muted-foreground/60",
                        hasError && "text-destructive",
                      )}
                    >
                      <span>{prop.name || "<UNNAMED>"}</span>
                      {prop.structure === "M" && (
                        <span className="text-[9px] font-mono font-normal text-muted-foreground">
                          [M]
                        </span>
                      )}
                      {!isCommitted && (
                        <span
                          className="text-[9px] font-mono font-bold text-amber-500 bg-amber-500/15 border border-amber-500/30 px-1 py-0.2 rounded"
                          title="Draft (Uncommitted)"
                        >
                          D
                        </span>
                      )}
                      {prop.required && !isArchived && (
                        <span className="text-destructive font-bold text-xs" title="Required Field">
                          *
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "text-[10px] truncate leading-tight",
                        hasError ? "text-destructive font-medium" : "text-muted-foreground",
                      )}
                    >
                      {hasError ? propErrors[0]?.message : prop.label || "No label"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                  {/* Property Data Type Badge (always visible) */}
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] h-4.5 px-1 rounded uppercase tracking-wider text-muted-foreground"
                  >
                    {prop.type}
                  </Badge>

                  {/* Status Badge: Archived */}
                  {isArchived && (
                    <Badge
                      variant="destructive"
                      className="font-mono text-[9px] h-4 px-1 rounded uppercase tracking-wider opacity-85"
                    >
                      Archived
                    </Badge>
                  )}

                  {/* Quick Delete Trash Icon for uncommitted draft fields */}
                  {!isReadOnly && !isCommitted && onDeleteField && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Delete draft field"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteField(prop.sn, true);
                      }}
                      className="size-5 p-0 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 opacity-70 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
