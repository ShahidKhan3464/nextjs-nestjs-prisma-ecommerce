import { Skeleton } from "@/components/ui/skeleton";

export function ReviewListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function NotificationListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ProductRailSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-7 w-40 rounded-md" />
      <div className="flex gap-4 overflow-hidden pb-1">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-56 w-40 shrink-0 rounded-xl sm:w-44"
          />
        ))}
      </div>
    </div>
  );
}
