"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";
import { appConfig } from "@/lib/core-config";

/**
 * Script injected synchronously before body paint to read the saved accent
 * from localStorage and apply `data-theme` to <html> with zero flash/flicker.
 * Uses standard JSX child text to strictly satisfy Biome without ignore comments.
 */
function AccentScript({ storageKey }: { storageKey: string }) {
  const code = `(function(){try{var a=localStorage.getItem("${storageKey}")||"color";document.documentElement.setAttribute("data-theme",a);}catch(e){}})();`;
  return <script suppressHydrationWarning>{code}</script>;
}

export function ThemeProvider({
  children,
  storageKey = appConfig.storage.local.themeMode,
  accentStorageKey = appConfig.storage.local.themeAccent,
  ...props
  
}: React.ComponentProps<typeof NextThemesProvider> & { accentStorageKey?: string }) {
  React.useEffect(() => {
    try {
      const s = localStorage.getItem(accentStorageKey) || "color";
      document.documentElement.setAttribute("data-theme", s);
    } catch {
      // ignore in environments with restricted localStorage
    }
  }, [accentStorageKey]);

  return (
    <>
      <AccentScript storageKey={accentStorageKey} />
      <NextThemesProvider storageKey={storageKey} {...props}>
        {children}
      </NextThemesProvider>
    </>
  );
}
