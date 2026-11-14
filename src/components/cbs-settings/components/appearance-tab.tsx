"use client";

import { Check } from "lucide-react";
import { ThemeToggle } from "@/components/layout/sidebar";
import { cn } from "@/lib/core-utils";
import { useThemeAccent } from "@/store";

export function AppearanceTab() {
  const { accent, setAccent, presets } = useThemeAccent();

  return (
    <div className="max-w-xl space-y-3">
      {/* Light / Dark Mode Toggle */}
      <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50 shadow-xs">
        <div>
          <h4 className="font-medium text-xs text-foreground">Theme Mode</h4>
          <p className="text-[11px] text-muted-foreground">
            Switch between light, dark, or system preference
          </p>
        </div>
        <ThemeToggle variant="group" />
      </div>

      {/* Brand Accent Theme Picker */}
      <div className="p-3 bg-background rounded-lg border border-border/50 shadow-xs space-y-2.5">
        <div>
          <h4 className="font-medium text-xs text-foreground">Brand Accent Color</h4>
          <p className="text-[11px] text-muted-foreground">
            Select a primary color theme for buttons, active tabs, and focus indicators
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setAccent(preset.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md border transition text-xs font-medium cursor-pointer",
                accent === preset.id
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border/60 hover:bg-muted/40 hover:text-foreground text-muted-foreground",
              )}
            >
              <div
                style={{ backgroundColor: preset.previewColor }}
                className="size-5 rounded-full flex items-center justify-center shrink-0 shadow-xs border border-border/40"
              >
                {accent === preset.id && <Check className="size-3 text-white" />}
              </div>
              <span className="text-[11px] truncate text-left">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
