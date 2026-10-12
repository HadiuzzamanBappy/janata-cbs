"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";
import { appConfig } from "@/lib/core-config";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    try {
      const s = localStorage.getItem(appConfig.storageKeys.themeAccent) || "color";
      document.documentElement.setAttribute("data-theme", s);
    } catch {
      // ignore in environments with restricted localStorage
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
