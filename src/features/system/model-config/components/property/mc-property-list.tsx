"use client";

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
import { PROPERTY_TYPES } from "@/lib/data-schemas/model-config-schema";

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
    const term = searchFilter.trim().toLowerCase();
    return properties.filter((prop) => {
      const matchSearch =
        !term ||
        prop.NAME.toLowerCase().includes(term) ||
        prop.LABEL.toLowerCase().includes(term) ||
        String(prop.SN).includes(term);
      const matchType = typeFilter === "ALL" || prop.TYPE === typeFilter;
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
              Columns
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
              <span>Add Column</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="size-3 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchFilter(e.target.value)}
              placeholder="Filter columns..."
              className="h-7 text-xs pl-7 pr-2 rounded bg-background border-border/80 focus:bg-background w-full"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(val: string | null) => val && setTypeFilter(val)}
          >
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

      {/* Flat Property Items List */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-border/20">
        {filteredProperties.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground select-none">
            <p>No columns match</p>
          </div>
        ) : (
          filteredProperties.map((prop) => {
            const isSelected = prop.SN === selectedSN;
            const isCommitted = isFieldCommitted ? isFieldCommitted(prop.SN) : true;
            const propErrors = validationErrors.filter(
              (err: ValidationErrorItem) => err.sn === prop.SN,
            );
            const hasError = propErrors.length > 0;
            const badgeLabel = prop.STRUCTURE === "M" ? `${prop.TYPE} (M)` : prop.TYPE;

            return (
              <div
                key={prop.SN}
                className={cn(
                  "relative flex items-center justify-between w-full py-1.5 px-2.5 transition-colors group select-none",
                  hasError && !isSelected && "bg-destructive/5 hover:bg-destructive/10",
                  isSelected
                    ? hasError
                      ? "bg-destructive/15 text-destructive border-l-3 border-l-destructive"
                      : "bg-primary/10 text-foreground font-semibold border-l-3 border-l-primary"
                    : hasError
                      ? "border-l-3 border-l-destructive/80 text-foreground"
                      : "hover:bg-muted/40 text-foreground border-l-3 border-l-transparent",
                )}
              >
                {/* Semantic accessible selection button */}
                <button
                  type="button"
                  onClick={() => onSelectSN(prop.SN)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left bg-transparent border-0 p-0 m-0 cursor-pointer focus:outline-none"
                >
                  {/* Sequence Number Badge */}
                  <span
                    className={cn(
                      "font-mono text-[10px] px-1 py-0.5 rounded shrink-0",
                      isSelected
                        ? "bg-primary/15 text-primary font-bold border border-primary/25"
                        : "bg-muted text-muted-foreground font-medium",
                    )}
                  >
                    #{prop.SN}
                  </span>

                  {/* Name & Label */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-xs truncate font-medium",
                          isSelected ? "text-foreground font-semibold" : "text-foreground",
                        )}
                      >
                        {prop.LABEL || prop.NAME || "<Unnamed>"}
                      </span>
                      {prop.REQUIRED && (
                        <span
                          className="text-destructive font-bold text-[10px] leading-none"
                          title="Mandatory Column"
                        >
                          *
                        </span>
                      )}
                    </div>
                    {prop.NAME && prop.LABEL && prop.NAME !== prop.LABEL && (
                      <div className="text-[10px] truncate leading-tight font-mono text-muted-foreground">
                        {prop.NAME}
                      </div>
                    )}
                  </div>
                </button>

                {/* Right Side Badges & Delete Button */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[10px] h-4.5 px-1.5 rounded uppercase tracking-wider",
                      isSelected
                        ? "border-primary/30 bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground border-border/70",
                    )}
                  >
                    {badgeLabel}
                  </Badge>

                  {/* Delete button (only uncommitted/draft columns can be removed) */}
                  {!isReadOnly && onDeleteField && !isCommitted && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Delete draft column"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onDeleteField(prop.SN, true);
                      }}
                      className="size-5 p-0 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
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
