import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_IDS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"];

export function ScreenLoader() {
  return (
    <div className="w-full h-full p-6 space-y-6 animate-in fade-in-50">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SKELETON_IDS.map((id) => (
          <div
            key={id}
            className="flex flex-col space-y-3 rounded-xl border p-4"
          >
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
