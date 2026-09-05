import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const FILTER_SLOTS = [
  "min-w-[min(100%,200px)]",
  "w-full min-w-[140px] sm:w-auto",
  "w-full min-w-[140px] sm:w-auto",
  "w-full min-w-[160px] sm:w-auto",
  "w-full min-w-[160px] sm:w-auto",
  "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end",
] as const;

export function ProductFiltersSkeleton() {
  return (
    <div className="bg-muted/40 border-border rounded-xl border p-4">
      <div className="flex flex-row flex-wrap items-end justify-end gap-4">
        {FILTER_SLOTS.map((slotClass, index) => (
          <div key={index} className={cn("space-y-2", slotClass)}>
            <Skeleton className="h-4 w-16" />
            <Skeleton
              className={cn(
                "h-10 rounded-md",
                index === FILTER_SLOTS.length - 1
                  ? "w-full sm:w-28"
                  : "w-full min-w-35"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
