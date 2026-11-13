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
    <div className="h-full w-full p-4 flex flex-col flex-1">
      <EmptyState
        icon={AlertTriangle}
        title="Dashboard Error"
        description={error.message || "An unexpected error occurred in the dashboard interface."}
        className="w-full flex-1"
        action={
          <Button onClick={() => reset()} variant="outline" size="sm" className="h-8 text-xs">
            Try Again
          </Button>
        }
      />
    </div>
  );
}
