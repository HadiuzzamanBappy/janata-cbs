"use client";

import { AlertOctagon } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

// global-error must wrap the entire HTML document in Next.js
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="h-screen w-full flex items-center justify-center bg-background p-4">
          <EmptyState
            icon={AlertOctagon}
            title="Fatal Application Error"
            description={error.message || "A critical error occurred at the root layout."}
            action={
              <Button onClick={() => reset()} variant="destructive">
                Hard Reset Application
              </Button>
            }
          />
        </div>
      </body>
    </html>
  );
}
