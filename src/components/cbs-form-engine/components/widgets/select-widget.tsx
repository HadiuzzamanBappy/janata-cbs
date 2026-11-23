/**
 * @fileoverview High-Density Lookup Input & Dropdown Selector Widget
 * @module form-engine/widgets/select-widget
 *
 * Core Invariants:
 * - Extends BaseWidgetProps.
 * - Dual-input mode: direct rapid code entry or inline chevron dropdown selection.
 * - Handles asynchronous model fetching state with loading spinner.
 */

"use client";

import { ChevronDown, Loader2, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { BaseWidgetProps, WidgetOption } from "../../types";
import { WIDGET_DISABLED_FIELD, WIDGET_TEXT, WIDGET_TEXT_SELECTED } from "./widget-styles";

export interface SelectWidgetProps extends BaseWidgetProps {
  options: WidgetOption[];
  loading?: boolean;
  isNumeric?: boolean;
  label?: string;
  onFetchOptions?: () => void;
}

export function SelectWidget({
  id,
  fieldKey: _fieldKey,
  value,
  onChange,
  disabled = false,
  error,
  placeholder,
  className,
  options = [],
  loading = false,
  isNumeric = false,
  label: _label,
  onFetchOptions,
}: SelectWidgetProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchQuery("");
    }
    if (open && onFetchOptions) {
      onFetchOptions();
    }
  };
  const strVal = String(value ?? "");

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (isNumeric) {
      if (raw === "") {
        onChange("");
        return;
      }
      const num = Number(raw);
      onChange(Number.isNaN(num) ? raw : num);
    } else {
      onChange(raw);
    }
  };

  const handleSelectOption = (code: string) => {
    if (isNumeric) {
      const num = Number(code);
      onChange(Number.isNaN(num) ? code : num);
    } else {
      onChange(code);
    }
    setIsOpen(false);
  };

  const showSearch = options.length > 10;

  const filteredOptions = React.useMemo(() => {
    if (!showSearch || !searchQuery.trim())
      return options;
    const query = searchQuery.trim().toLowerCase();
    return options.filter((opt) => {
      const target = (opt.code + opt.label).toLowerCase();
      return target.includes(query);
    })
  }, [searchQuery, options, showSearch]);

  return (
    <div className={cn("flex items-center gap-1.5 min-w-0 max-w-full w-full", className)}>
      {/* 1. Direct Text / Value Input */}
      <div className="relative flex-1 min-w-0">
        <Input
          type="text"
          id={id}
          disabled={disabled || loading}
          placeholder={placeholder || "Type code or select..."}
          value={strVal}
          onChange={handleTextChange}
          className={cn(
            `h-7 ${WIDGET_TEXT} font-mono bg-background rounded border-border/80 w-full focus-visible:ring-0 focus-visible:border-foreground/50`,
            error && "border-destructive focus-visible:border-destructive bg-destructive/5",
            disabled && WIDGET_DISABLED_FIELD,
          )}
        />
      </div>

      {/* 2. Dropdown Action Button beside it */}
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              disabled={disabled || loading}
              className={cn(
                "size-7 bg-background border-border/80 text-muted-foreground hover:text-foreground shadow-2xs shrink-0 cursor-pointer rounded",
                isOpen && "bg-muted text-foreground",
              )}
              aria-label="Toggle options list"
              title="Select from options"
            >
              {loading ? (
                <Loader2 className="size-3 animate-spin text-primary" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </Button>
          }
        />

        <DropdownMenuContent
          side="bottom"
          align="end"
          sideOffset={4}
          className={`min-w-44 max-w-72 w-auto max-h-56 overflow-y-auto ${WIDGET_TEXT} p-1 shadow-lg border border-border/80 bg-popover z-50 font-sans`}
        >
          {showSearch && !loading && (
            <div className="sticky top-0 bg-popover z-10 border-b border-border/10">
              <div className="relative flex items-center">
                <Search className="size-3 text-muted-foreground absolute left-2 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Filter options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="h-6 w-full pl-6 pr-2 text-2xs bg-background rounded border-border/80 focus-visible:ring-0"
                  autoFocus
                />
              </div>
            </div>
          )}
          {loading ? (
            <div
              className={`p-3 text-center ${WIDGET_TEXT} text-muted-foreground font-mono flex items-center justify-center gap-1.5`}
            >
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Fetching options...</span>
            </div>
          ) : filteredOptions.length === 0 ? (
            <div
              className={`p-3 text-center ${WIDGET_TEXT} text-muted-foreground font-mono italic`}
            >
              No options available
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const displayLabel = opt.label || opt.code;
              const isSelected =
                opt.code.toLowerCase() === strVal.toLowerCase() ||
                opt.label.toLowerCase() === strVal.toLowerCase();
              return (
                <DropdownMenuItem
                  key={opt.code}
                  onClick={() => handleSelectOption(opt.code)}
                  className={cn(
                    `${WIDGET_TEXT} py-1.5 px-2 cursor-pointer flex items-center leading-snug whitespace-normal wrap-break-word`,
                    isSelected && `bg-primary/10 text-primary ${WIDGET_TEXT_SELECTED}`,
                  )}
                >
                  <span>{displayLabel}</span>
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
