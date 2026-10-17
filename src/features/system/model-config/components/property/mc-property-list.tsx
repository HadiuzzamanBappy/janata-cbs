import { ChevronDown, ChevronRight, Database, Plus, Search, Trash2 } from "lucide-react";
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
  onAddChild?: (parentSN: string) => void;
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
  onAddChild,
  onDeleteField,
}: McPropertyListProps) {
  const [searchFilter, setSearchFilter] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [collapsedSNs, setCollapsedSNs] = React.useState<Set<string>>(new Set());

  const handleAddField = () => {
    const newSn = onAddField();
    if (newSn && typeof newSn === "string") {
      onSelectSN(newSn);
    }
  };

  const toggleCollapse = (sn: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedSNs((prev) => {
      const next = new Set(prev);
      if (next.has(sn)) {
        next.delete(sn);
      } else {
        next.add(sn);
      }
      return next;
    });
  };

  const isHiddenByCollapse = React.useCallback(
    (sn: string): boolean => {
      if (searchFilter.trim()) return false;
      const parts = sn.split("_");
      if (parts.length <= 1) return false;
      let prefix = parts[0];
      for (let i = 1; i < parts.length; i++) {
        if (collapsedSNs.has(prefix)) return true;
        prefix = `${prefix}_${parts[i]}`;
      }
      return false;
    },
    [collapsedSNs, searchFilter],
  );

  const filteredProperties = React.useMemo(() => {
    return properties.filter((p) => {
      if (isHiddenByCollapse(p.sn)) return false;
      const matchSearch =
        !searchFilter.trim() ||
        p.name.toLowerCase().includes(searchFilter.trim().toLowerCase()) ||
        p.label.toLowerCase().includes(searchFilter.trim().toLowerCase()) ||
        p.sn.includes(searchFilter.trim());
      const matchType = typeFilter === "ALL" || p.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [properties, isHiddenByCollapse, searchFilter, typeFilter]);

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

      {/* Property Items Tree List */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-border/20">
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

            const parts = prop.sn.split("_");
            const depth = parts.length - 1;
            const isObject = prop.type === "Object";
            const isCollapsed = collapsedSNs.has(prop.sn);
            const badgeLabel = isObject && prop.structure === "M" ? "Object.M" : prop.type;

            return (
              <div
                key={prop.sn}
                style={{ paddingLeft: `${depth * 14 + 8}px` }}
                className={cn(
                  "relative flex items-center justify-between w-full py-1 pr-2 transition-colors group select-none",
                  hasError && !isSelected && "bg-destructive/5 hover:bg-destructive/10",
                  isSelected
                    ? hasError
                      ? "bg-destructive/15 text-destructive border-l-3 border-l-destructive"
                      : "bg-primary text-primary-foreground font-semibold"
                    : hasError
                      ? "border-l-3 border-l-destructive/80 text-foreground"
                      : "hover:bg-muted/40 text-foreground border-l-3 border-l-transparent",
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 py-0.5">
                  {isObject ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => toggleCollapse(prop.sn, e)}
                      className={cn(
                        "size-4.5 p-0 rounded shrink-0",
                        isSelected
                          ? "text-primary-foreground hover:bg-primary-foreground/20"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                    </Button>
                  ) : depth > 0 ? (
                    <span
                      className={cn(
                        "text-xs font-mono shrink-0 select-none px-0.5",
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground/60",
                      )}
                    >
                      ↳
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onSelectSN(prop.sn)}
                    className="flex items-center gap-1.5 min-w-0 flex-1 text-left cursor-pointer outline-none"
                  >
                    <span
                      className={cn(
                        "font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0",
                        hasError
                          ? "bg-destructive/20 text-destructive border-destructive/50"
                          : isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/40"
                            : "bg-muted text-muted-foreground border-border/70",
                      )}
                    >
                      #{prop.sn}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "font-mono text-xs font-semibold truncate leading-tight flex items-center gap-1",
                          isArchived && "line-through opacity-70",
                          hasError && !isSelected && "text-destructive",
                        )}
                      >
                        <span>{prop.label || prop.name || "<UNNAMED>"}</span>
                        {!isCommitted && (
                          <span
                            className={cn(
                              "text-[9px] font-mono font-bold px-1 py-0.2 rounded border",
                              isSelected
                                ? "bg-amber-400 text-amber-950 border-amber-300"
                                : "text-amber-500 bg-amber-500/15 border-amber-500/30",
                            )}
                            title="Draft (Uncommitted)"
                          >
                            D
                          </span>
                        )}
                        {prop.required && !isArchived && (
                          <span
                            className={cn(
                              isSelected ? "text-primary-foreground" : "text-destructive",
                              "font-bold text-xs",
                            )}
                          >
                            *
                          </span>
                        )}
                      </div>
                      {prop.name && prop.label && prop.name !== prop.label && (
                        <div
                          className={cn(
                            "text-[10px] truncate leading-tight font-mono",
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                          )}
                        >
                          {prop.name}
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                {/* Right Side Badges & Quick Action Buttons */}
                <div className="flex items-center gap-1 shrink-0 ml-1.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[10px] h-4.5 px-1.5 rounded uppercase tracking-wider",
                      isSelected
                        ? "border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground"
                        : "text-muted-foreground border-border/70",
                    )}
                  >
                    {badgeLabel}
                  </Badge>

                  {/* Add Child button for Object items */}
                  {isObject && !isReadOnly && onAddChild && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Add child field to this object group"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddChild(prop.sn);
                      }}
                      className={cn(
                        "size-5 p-0 rounded transition-opacity",
                        isSelected
                          ? "text-primary-foreground hover:bg-primary-foreground/20"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-70 group-hover:opacity-100",
                      )}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  )}

                  {/* Delete button */}
                  {!isReadOnly && onDeleteField && (!isCommitted || isSelected) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Delete field"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteField(prop.sn, !isCommitted);
                      }}
                      className={cn(
                        "size-5 p-0 rounded transition-opacity",
                        isSelected
                          ? "text-primary-foreground hover:bg-destructive hover:text-destructive-foreground"
                          : "text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 opacity-70 group-hover:opacity-100",
                      )}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
