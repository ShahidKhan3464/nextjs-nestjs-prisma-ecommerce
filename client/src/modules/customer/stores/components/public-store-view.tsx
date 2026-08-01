"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStoreBySlug } from "../services/stores.service";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { VerifiedBadge } from "@/modules/customer/products/components/verified-badge";
import { ProductFilters } from "@/modules/customer/products/components/product-filters";
import { ProductListing } from "@/modules/customer/products/components/product-listing";
import { ProductFiltersSkeleton } from "@/modules/customer/products/components/product-filters-skeleton";
import {
  getStoreFile,
  isStoreVerified,
  type Store,
} from "@/modules/seller/store/types";

type Props = {
  slug: string;
  initialStore?: Store;
};

export function PublicStoreView({ slug, initialStore }: Props) {
  const { data: store, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.stores.bySlug(slug),
    queryFn: () => fetchStoreBySlug(slug),
    initialData: initialStore,
  });

  if (isPending && !store) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="size-20 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
        <ProductFiltersSkeleton />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl sm:h-52" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !store) {
    return (
      <EmptyState
        title="Store not found"
        description="This store may be unavailable or the link is incorrect."
        action={
          <Button type="button" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const logo = getStoreFile(store, "LOGO");
  const verified = isStoreVerified(store);
  const initial = store.name.charAt(0).toUpperCase() || "?";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {logo ? (
            <Image
              fill
              sizes="80px"
              src={logo.file.urlPath}
              className="object-cover"
              alt={`${store.name} logo`}
            />
          ) : (
            <div className="text-muted-foreground flex size-full items-center justify-center text-2xl font-semibold">
              {initial}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {store.name}
            </h1>
            {verified ? <VerifiedBadge /> : null}
          </div>
          <p className="text-muted-foreground text-sm">
            {store.sellerProfile.businessName}
          </p>
          {store.description?.trim() ? (
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              {store.description}
            </p>
          ) : null}
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Products from this store
        </h2>
        <ProductFilters />
        <ProductListing storeId={store.id} />
      </section>
    </div>
  );
}
