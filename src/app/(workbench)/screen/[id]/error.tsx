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
    <div className="fixed inset-0 z-50 p-4 flex flex-col bg-background">
      <EmptyState
        icon={AlertTriangle}
        title="Screen Crash"
        description={error.message || "An error occurred while rendering this popup window."}
        className="w-full h-full flex-1"
        action={
          <Button onClick={() => reset()} variant="outline" size="sm" className="h-8 text-xs">
            Reload Screen
          </Button>
        }
      />
    </div>
  );
}
