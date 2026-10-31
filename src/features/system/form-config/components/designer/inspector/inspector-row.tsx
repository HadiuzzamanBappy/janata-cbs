import { Info } from "lucide-react";
import type * as React from "react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface InspectorRowProps {
  label: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}

export function InspectorRow({ label, required, description, children }: InspectorRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs select-none font-normal">
        <Label className="text-[11px] font-medium text-muted-foreground select-none flex items-center">
          {label}
          {required && <span className="text-destructive font-semibold ml-0.5">*</span>}
        </Label>
        {description && (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex items-center text-muted-foreground/60 hover:text-foreground cursor-help p-0.5 transition-colors">
                  <Info className="size-3" />
                </span>
              }
            />
            <TooltipContent side="left" className="text-xs max-w-xs z-50">
              {description}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}
