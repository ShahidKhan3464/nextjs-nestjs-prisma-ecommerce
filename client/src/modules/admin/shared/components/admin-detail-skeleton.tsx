import { Skeleton } from "@/components/ui/skeleton";

export function AdminDetailSkeleton() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_500px]">
      <div className="space-y-6">
        <Skeleton className="h-24 w-full max-w-md" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
      <aside className="bg-muted/40 border-border space-y-4 rounded-xl border p-4 lg:sticky lg:top-28">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-28 w-full" />
      </aside>
    </div>
  );
}
