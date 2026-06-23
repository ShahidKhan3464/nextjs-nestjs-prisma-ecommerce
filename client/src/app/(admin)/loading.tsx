import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-72" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
