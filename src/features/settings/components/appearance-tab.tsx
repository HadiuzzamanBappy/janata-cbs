"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/layout/header/theme-toggle";
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
    <div className="max-w-2xl space-y-6">
      {/* Light / Dark Mode Toggle */}
      <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/50 shadow-xs">
        <div>
          <h4 className="font-medium text-sm">Theme Mode</h4>
          <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
        </div>
        <ThemeToggle variant="group" />
      </div>

      {/* Brand Accent Theme Picker */}
      <div className="p-4 bg-background rounded-lg border border-border/50 shadow-xs space-y-3">
        <div>
          <h4 className="font-medium text-sm">Brand Accent Color</h4>
          <p className="text-xs text-muted-foreground">
            Select a primary color theme for buttons, active tabs, and focus indicators
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleThemeChange(preset.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-lg border transition text-xs font-medium cursor-pointer",
                activeTheme === preset.id
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border/60 hover:bg-accent hover:text-accent-foreground text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shadow-xs",
                  preset.color,
                )}
              >
                {activeTheme === preset.id && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-[11px] truncate w-full text-center">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
