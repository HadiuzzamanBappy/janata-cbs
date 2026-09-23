"use client";

import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-muted/10">
      <EmptyState
        icon={AlertTriangle}
        title="Dashboard Error"
        description={
          error.message ||
          "An unexpected error occurred in the dashboard interface."
        }
        action={
          <Button onClick={() => reset()} variant="outline">
            Try Again
          </Button>
        }
      />
    </div>
  );
}
