/**
 * @fileoverview Column list panel for MODEL.CONFIG properties tab.
 * Renders filterable property hierarchy with selection states, validation badges,
 * subfield insertion, and append-only deletion safeguards.
 *
 * @module features/system/model-config/components/property/mc-property-list
 */

"use client";

import { Plus, Search } from "lucide-react";
import * as React from "react";
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
import { CBS_PROPERTY_TYPE, type ModelProperty, PROPERTY_TYPES } from "@/lib/data-schemas";
import type { ModelValidationErrorItem } from "../../hooks/mc-validation";
import { McPropertyItem } from "./mc-property-item";

interface McPropertyListProps {
  properties: ModelProperty[];
  selectedSN: string | null;
  onSelectSN: (sn: string) => void;
  isReadOnly: boolean;
  isFieldCommitted?: (sn: string) => boolean;
  validationErrors?: ModelValidationErrorItem[];
  onAddField: () => string;
  onAddSubField?: (parentSn: string) => string;
  onDeleteField?: (sn: string) => void;
  className?: string;
}

export function McPropertyList({
  properties,
  selectedSN,
  onSelectSN,
  isReadOnly,
  isFieldCommitted,
  validationErrors = [],
  onAddField,
  onAddSubField,
  onDeleteField,
  className,
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
        !term || prop.NAME.toLowerCase().includes(term) || String(prop.SN).includes(term);
      const matchType = typeFilter === "ALL" || prop.TYPE === typeFilter;
      return matchSearch && matchType;
    });
  }, [properties, searchFilter, typeFilter]);

  return (
    <div
      className={cn(
        "w-72 sm:w-80 border-r border-border/70 flex flex-col bg-card shrink-0 min-h-0 overflow-hidden",
        className,
      )}
    >
      {/* Top Search & Filter Bar */}
      <div className="p-2 border-b border-border/70 space-y-1.5 shrink-0 bg-muted/20">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide truncate">
              Columns ({properties.length})
            </span>
          </div>

          {!isReadOnly && (
            <Button
              type="button"
              size="sm"
              onClick={handleAddField}
              className="h-7 text-xs gap-1 px-2 sm:px-2.5 font-medium rounded shadow-xs shrink-0 cursor-pointer"
              title="Add a column"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Add</span>
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
            const isCommitted = isFieldCommitted ? isFieldCommitted(prop.SN) : true;

            return (
              <div key={prop.SN} className="flex flex-col">
                <McPropertyItem
                  prop={prop}
                  isSelected={prop.SN === selectedSN}
                  isReadOnly={isReadOnly}
                  isCommitted={isCommitted}
                  validationErrors={validationErrors}
                  onSelect={onSelectSN}
                  onDelete={onDeleteField}
                />

                {/* Sub-properties container when TYPE is Array */}
                {prop.TYPE === CBS_PROPERTY_TYPE.ARRAY && (
                  <div className="bg-muted/15 border-l-2 border-primary/30 ml-3.5 my-0.5 space-y-0.5">
                    {(prop.PROP || []).map((sub) => (
                      <McPropertyItem
                        key={sub.SN}
                        prop={sub}
                        isSelected={sub.SN === selectedSN}
                        isReadOnly={isReadOnly}
                        isCommitted={isFieldCommitted ? isFieldCommitted(sub.SN) : true}
                        validationErrors={validationErrors}
                        onSelect={onSelectSN}
                        onDelete={onDeleteField}
                        isSub
                      />
                    ))}
                    {!isReadOnly && onAddSubField && (
                      <div className="px-2 py-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSn = onAddSubField(prop.SN);
                            if (newSn) onSelectSN(newSn);
                          }}
                          className="h-5 text-3xs text-primary hover:text-primary hover:bg-primary/10 gap-1 px-1.5 w-full justify-start cursor-pointer font-medium"
                        >
                          <Plus className="size-3" />
                          <span>Add Sub-Property</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
