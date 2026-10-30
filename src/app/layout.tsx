import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CBS_THEME_PRESETS,
  type CbsThemeAccent,
  clientConfig,
  DEFAULT_THEME_ACCENT,
  THEME_COOKIE_NAME,
} from "@/lib/core-config";
import { ThemeProvider } from "@/store";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Janata Bank PLc.",
  description: "Core banking client.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read persisted theme cookie synchronously on the server (Zero FOUC, Zero Client Scripts)
  const cookieStore = await cookies();
  const rawTheme = cookieStore.get(THEME_COOKIE_NAME)?.value as CbsThemeAccent | undefined;
  const initialTheme =
    rawTheme && CBS_THEME_PRESETS.some((p) => p.id === rawTheme) ? rawTheme : DEFAULT_THEME_ACCENT;

  return (
    <html
      lang="en"
      data-theme={initialTheme}
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey={clientConfig.storage.local.themeMode}
        >
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
