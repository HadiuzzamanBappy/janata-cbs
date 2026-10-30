"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";
import { appConfig } from "@/lib/core-config";

export function ThemeProvider({
  children,
  storageKey = appConfig.storage.local.themeMode,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider storageKey={storageKey} {...props}>
      {children}
    </NextThemesProvider>
  );
}
