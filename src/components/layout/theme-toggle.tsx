"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "dropdown" | "group";
}

export function ThemeToggle({ variant = "dropdown" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (variant === "group") {
    if (!mounted) {
      return (
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50 opacity-50">
          <div className="w-10 h-8 rounded-md" />
          <div className="w-10 h-8 rounded-md" />
          <div className="w-10 h-8 rounded-md" />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50">
        <button
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center justify-center w-10 h-8 rounded-md transition-all text-muted-foreground hover:text-foreground",
            theme === "light" && "bg-background shadow-sm text-foreground",
          )}
          title="Light Mode"
        >
          <Sun className="size-4" />
        </button>
        <button
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center justify-center w-10 h-8 rounded-md transition-all text-muted-foreground hover:text-foreground",
            theme === "system" && "bg-background shadow-sm text-foreground",
          )}
          title="System Preference"
        >
          <Monitor className="size-4" />
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center justify-center w-10 h-8 rounded-md transition-all text-muted-foreground hover:text-foreground",
            theme === "dark" && "bg-background shadow-sm text-foreground",
          )}
          title="Dark Mode"
        >
          <Moon className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="bg-background border-border/80 hover:bg-accent hover:text-accent-foreground"
          />
        }
      >
        {mounted && theme === "system" && <Monitor className="h-4 w-4" />}
        {mounted && theme === "light" && <Sun className="h-4 w-4" />}
        {mounted && theme === "dark" && <Moon className="h-4 w-4" />}
        {!mounted && <Sun className="h-4 w-4 opacity-50" />}
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
