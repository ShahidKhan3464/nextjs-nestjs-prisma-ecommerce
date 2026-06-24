import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-16 sm:px-6">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-4/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
