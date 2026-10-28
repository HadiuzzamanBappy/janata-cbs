"use client";

import { CheckCircle2, Search, Sparkles } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cbs } from "@/lib/cbs-client";
import { cn } from "@/lib/core-utils";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";

export interface ColumnModelPopoverProps {
  targetModel?: string;
  configuredFieldNames: Set<string>;
  onImportProperty: (prop: ModelProperty) => void;
  disabled?: boolean;
}

export function ColumnModelPopover({
  targetModel,
  configuredFieldNames,
  onImportProperty,
  disabled = false,
}: ColumnModelPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [modelProps, setModelProps] = React.useState<ModelProperty[]>([]);

  React.useEffect(() => {
    let mounted = true;
    if (!targetModel) {
      setModelProps([]);
      return;
    }

    async function loadModel() {
      try {
        const res = await cbs.send<ModelConfigRecord>(cbs.modelConfig.get(targetModel as string), {
          silent: true,
        });
        if (mounted && res.status === "SUCCESS" && res.data?.PROPERTIES) {
          setModelProps(res.data.PROPERTIES);
        }
      } catch {
        if (mounted) setModelProps([]);
      }
    }

    loadModel();
    return () => {
      mounted = false;
    };
  }, [targetModel]);

  const availableProps = React.useMemo(() => {
    return modelProps.filter((p) => Boolean(p.NAME));
  }, [modelProps]);

  const filteredProps = React.useMemo(() => {
    if (!search.trim()) return availableProps;
    const term = search.toLowerCase();
    return availableProps.filter(
      (p) =>
        p.NAME?.toLowerCase().includes(term) ||
        p.LABEL?.toLowerCase().includes(term) ||
        p.TYPE?.toLowerCase().includes(term),
    );
  }, [availableProps, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || !targetModel}
            className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary/80"
            title={targetModel ? `Import columns from ${targetModel}` : "No Target Model set"}
          >
            <Sparkles className="size-3" />
            <span>Import</span>
          </Button>
        }
      />
      <PopoverContent className="w-72 p-0 gap-0 overflow-hidden shadow-md" align="start">
        <div className="p-2 space-y-1.5 border-b border-border/60 bg-muted/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Model: {targetModel}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {availableProps.length} fields
            </span>
          </div>
          <div className="relative">
            <Search className="size-3 text-muted-foreground/60 absolute left-2 top-2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search properties..."
              className="h-7 text-xs pl-7 pr-2 font-mono bg-background"
            />
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 min-h-16">
          {filteredProps.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              {availableProps.length === 0 ? "No model properties found" : "No matching fields"}
            </div>
          ) : (
            filteredProps.map((prop) => {
              const isConfigured = configuredFieldNames.has(prop.NAME.toLowerCase());
              return (
                <button
                  type="button"
                  key={prop.NAME}
                  disabled={isConfigured}
                  onClick={() => {
                    onImportProperty(prop);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-colors group cursor-pointer",
                    isConfigured
                      ? "opacity-40 cursor-not-allowed bg-muted/20"
                      : "hover:bg-primary/10",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs font-medium block truncate group-hover:text-primary">
                      {prop.NAME}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {prop.LABEL || prop.NAME}
                    </span>
                  </div>
                  {isConfigured ? (
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 ml-1" />
                  ) : (
                    <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0 uppercase">
                      {prop.TYPE || "Text"}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
