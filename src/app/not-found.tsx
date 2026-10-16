import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/sidebar/widgets/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { appConfig } from "@/lib/core-config";

export default function GlobalNotFound() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-4 select-none">
      {/* Top-Right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Centered Minimal Not Found Card */}
      <div className="flex flex-col items-center justify-center text-center max-w-md w-full p-8 rounded-md border border-dashed border-border/80 bg-card/60 shadow-xs">
        <div className="size-11 rounded-md border border-border/60 bg-muted/50 text-muted-foreground flex items-center justify-center mb-4 shadow-2xs">
          <FileQuestion className="size-5.5 text-primary" />
        </div>
        <h2 className="text-base font-semibold text-foreground tracking-tight">Page Not Found</h2>
        <p className="mt-1.5 mb-6 text-xs text-muted-foreground leading-relaxed">
          The requested URL does not match any valid CBS screen, workbench tab, or documentation
          page.
        </p>
        <Link
          href={appConfig.routes.dashboard}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
