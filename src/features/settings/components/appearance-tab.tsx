"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/layout/sidebar";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

const THEME_PRESETS = [
  { id: "color", name: "Janata Brand (Cyan)", color: "bg-[#00adee]" },
  {
    id: "bw",
    name: "Monochrome (B&W)",
    color: "bg-zinc-900 dark:bg-zinc-100 border border-border",
  },
];

export function AppearanceTab() {
  const [activeTheme, setActiveTheme] = useState("color");

  useEffect(() => {
    const saved = localStorage.getItem(appConfig.storageKeys.themeAccent) || "color";
    setActiveTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem(appConfig.storageKeys.themeAccent, themeId);
    document.documentElement.setAttribute("data-theme", themeId);
  };

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
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleThemeChange(preset.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md border transition text-xs font-medium cursor-pointer",
                activeTheme === preset.id
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border/60 hover:bg-muted/40 hover:text-foreground text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "size-5 rounded-full flex items-center justify-center shrink-0 shadow-xs",
                  preset.color,
                )}
              >
                {activeTheme === preset.id && <Check className="size-3 text-white" />}
              </div>
              <span className="text-[11px] truncate text-left">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
