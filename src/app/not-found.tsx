import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function GlobalNotFound() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background p-4">
      <EmptyState
        icon={FileQuestion}
        title="Page Not Found"
        description="The URL you are looking for does not exist or has been moved."
        action={
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Return to Dashboard
          </Link>
        }
      />
    </div>
  );
}
