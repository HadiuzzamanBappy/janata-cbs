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

import { ChevronDown, Loader2 } from "lucide-react";
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

export interface SelectWidgetProps extends BaseWidgetProps {
  options: WidgetOption[];
  loading?: boolean;
  isNumeric?: boolean;
  label?: string;
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
}: SelectWidgetProps) {
  const [isOpen, setIsOpen] = React.useState(false);
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
            "h-7 text-xs font-mono bg-background rounded border-border/80 w-full focus-visible:ring-0 focus-visible:border-foreground/50",
            error && "border-destructive focus-visible:border-destructive bg-destructive/5",
            disabled &&
              "disabled:opacity-90 disabled:cursor-default disabled:bg-muted/15 font-medium",
          )}
        />
      </div>

      {/* 2. Dropdown Action Button beside it */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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
          className="min-w-44 max-w-72 w-auto max-h-56 overflow-y-auto text-xs p-1 shadow-lg border border-border/80 bg-popover z-50 font-sans"
        >
          {loading ? (
            <div className="p-3 text-center text-xs text-muted-foreground font-mono flex items-center justify-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Fetching options...</span>
            </div>
          ) : options.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground font-mono italic">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const displayLabel = opt.label || opt.code;
              const isSelected =
                opt.code.toLowerCase() === strVal.toLowerCase() ||
                opt.label.toLowerCase() === strVal.toLowerCase();
              return (
                <DropdownMenuItem
                  key={opt.code}
                  onClick={() => handleSelectOption(opt.code)}
                  className={cn(
                    "text-xs py-1.5 px-2 cursor-pointer flex items-center leading-snug whitespace-normal wrap-break-word",
                    isSelected && "bg-primary/10 text-primary font-semibold",
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
