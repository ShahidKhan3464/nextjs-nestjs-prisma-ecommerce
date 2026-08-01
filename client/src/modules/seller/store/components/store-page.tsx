"use client";

import { StoreView } from "./store-view";
import { isStoreSuspended } from "../types";
import { useIsSeller } from "@/modules/auth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { StoreEditForm } from "./store-edit-form";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { Separator } from "@/components/ui/separator";
import { StoreImageUpload } from "./store-image-upload";
import { fetchMyStore } from "../services/store.service";
import { EmptyState } from "@/shared/components/feedback/empty-state";

function StorePageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="aspect-3/1 w-full rounded-lg" />
      <div className="flex gap-4">
        <Skeleton className="size-24 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function StorePage() {
  const isSeller = useIsSeller();

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.store.me,
    queryFn: fetchMyStore,
    enabled: isSeller,
  });

  if (!isSeller) {
    return (
      <EmptyState
        title="Seller access required"
        description="Only approved sellers can manage a store."
      />
    );
  }

  if (isPending) {
    return <StorePageSkeleton />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Could not load store"
        description={getApiErrorMessage(error, "Please try again.")}
        action={
          <Button
            size="sm"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? "Retrying…" : "Retry"}
          </Button>
        }
      />
    );
  }

  const suspended = isStoreSuspended(data);

  return (
    <div className="space-y-8">
      <StoreView store={data} />
      <Separator />
      <StoreImageUpload store={data} disabled={suspended} />
      <Separator />
      <StoreEditForm store={data} disabled={suspended} />
    </div>
  );
}
