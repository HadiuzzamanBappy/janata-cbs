"use client";

import { ThemeToggle } from "@/components/theme-toggle";

export function AppearanceTab() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/50 shadow-sm">
        <div>
          <h4 className="font-medium text-sm">Theme Preference</h4>
          <p className="text-xs text-muted-foreground">
            Switch between light and dark mode
          </p>
        </div>
        <ThemeToggle variant="group" />
      </div>
    </div>
  );
}
