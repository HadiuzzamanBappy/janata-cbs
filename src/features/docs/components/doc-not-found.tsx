// Documentation Not-Found Component
import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface DocNotFoundProps {
  portal: "devs" | "manual";
}

export function DocNotFound({ portal }: DocNotFoundProps) {
  const portalName = portal === "devs" ? "Developer Hub" : "Officer Manual";
  const portalHome = `/${portal}`;

  return (
    <article className="space-y-4">
      <div className="flex flex-col items-center justify-center text-center p-8 rounded-md border border-dashed border-border/80 bg-card/60 shadow-xs">
        <div className="size-10 rounded-md border border-border/60 bg-muted/50 text-muted-foreground flex items-center justify-center mb-3 shadow-2xs">
          <FileQuestion className="size-5 text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground tracking-tight">Document Not Found</h2>
        <p className="mt-1 mb-4 text-xs text-muted-foreground leading-normal max-w-sm">
          The requested documentation article could not be found in the {portalName}. Please select
          an article from the sidebar or return to the overview.
        </p>
        <Link href={portalHome} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Return to {portalName} Overview
        </Link>
      </div>
    </article>
  );
}
