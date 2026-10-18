"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";
import { appConfig } from "@/lib/core-config";

export function ThemeProvider({
  children,
  storageKey = appConfig.storage.local.themeMode,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    try {
      const s = localStorage.getItem(appConfig.storage.local.themeAccent) || "color";
      document.documentElement.setAttribute("data-theme", s);
    } catch {
      // ignore in environments with restricted localStorage
    }
  }, []);

  return (
    <NextThemesProvider storageKey={storageKey} {...props}>
      {children}
    </NextThemesProvider>
  );
}
