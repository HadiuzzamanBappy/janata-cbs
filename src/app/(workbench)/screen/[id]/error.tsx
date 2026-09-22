"use client";

import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export default function ScreenError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <EmptyState
        icon={AlertTriangle}
        title="Screen Crash"
        description={error.message || "An error occurred while rendering this popup window."}
        action={
          <Button onClick={() => reset()} variant="outline">
            Reload Screen
          </Button>
        }
      />
    </div>
  );
}
