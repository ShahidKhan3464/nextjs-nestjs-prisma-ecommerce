"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function CheckoutPageSkeleton() {
  return (
    <div className="grid gap-10 py-5 lg:grid-cols-[1fr_450px]">
      <div className="space-y-6">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <div className="space-y-4 rounded-xl border p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export function CheckoutSuccessSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="size-16 rounded-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
