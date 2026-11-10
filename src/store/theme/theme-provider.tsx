"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";
import { clientConfig } from "@/lib/core-config";

export function ThemeProvider({
  children,
  storageKey = clientConfig.storage.local.themeMode,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider storageKey={storageKey} {...props}>
      {children}
    </NextThemesProvider>
  );
}
