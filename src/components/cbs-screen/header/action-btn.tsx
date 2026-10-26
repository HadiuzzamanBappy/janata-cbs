"use client";

import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface ActionBtnProps {
  onClick?: () => void;
  enabled?: boolean;
  reason?: string;
  defaultTooltip: string;
  variant?: "default" | "destructive" | "ghost";
  className?: string;
  children: React.ReactNode;
}

/**
 * Universal atomic action button for CBS screen headers.
 * Standardizes button sizing (h-7 w-9), accessible tooltips, and disabled states.
 */
export function ActionBtn({
  onClick,
  enabled = true,
  reason,
  defaultTooltip,
  variant = "default",
  className,
  children,
}: ActionBtnProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant={variant}
            size="icon-sm"
            onClick={onClick}
            disabled={!enabled}
            className={`h-7 w-9 shadow-xs shrink-0 disabled:opacity-40 ${className || ""}`.trim()}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent className="text-xs">{reason || defaultTooltip}</TooltipContent>
    </Tooltip>
  );
}
