"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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

function formatStoreLocation(store: Store) {
  return [store.address, store.city, store.postalCode, store.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

function StoreHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-3/1 w-full rounded-lg" />
      <div className="flex items-start gap-4">
        <Skeleton className="size-20 shrink-0 rounded-lg sm:size-24" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>
    </div>
  );
}

export function PublicStoreView({ slug, initialStore }: Props) {
  const { data: store, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.stores.bySlug(slug),
    queryFn: () => fetchStoreBySlug(slug),
    initialData: initialStore,
  });

  if (isPending && !store) {
    return (
      <div className="space-y-6">
        <StoreHeaderSkeleton />
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
  const banner = getStoreFile(store, "BANNER");
  const verified = isStoreVerified(store);
  const location = formatStoreLocation(store);
  const initial = store.name.charAt(0).toUpperCase() || "?";

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="relative aspect-3/1 w-full overflow-hidden rounded-lg border bg-muted">
          {banner ? (
            <Image
              fill
              priority
              className="object-cover"
              src={banner.file.urlPath}
              alt={`${store.name} banner`}
              sizes="(max-width: 896px) 100vw, 896px"
            />
          ) : (
            <div
              aria-hidden
              className="from-muted via-muted/80 to-muted-foreground/10 size-full bg-linear-to-br"
            />
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border bg-muted sm:size-24">
            {logo ? (
              <Image
                fill
                sizes="96px"
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
              <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed whitespace-pre-wrap">
                {store.description}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <section className="space-y-3" aria-labelledby="store-info-heading">
        <h2
          id="store-info-heading"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          Store information
        </h2>
        {location ? (
          <p className="text-muted-foreground flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{location}</span>
          </p>
        ) : null}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Address</dt>
            <dd className="font-medium">{store.address || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">City</dt>
            <dd className="font-medium">{store.city || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Postal code</dt>
            <dd className="font-medium">{store.postalCode || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Country</dt>
            <dd className="font-medium">{store.country || "—"}</dd>
          </div>
        </dl>
      </section>

      <Separator />

      <section className="space-y-4" aria-labelledby="store-products-heading">
        <h2
          id="store-products-heading"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          Products from this store
        </h2>
        <ProductFilters />
        <ProductListing storeId={store.id} />
      </section>
    </div>
  );
}
