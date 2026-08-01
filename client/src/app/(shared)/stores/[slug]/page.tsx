import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFiltersSkeleton } from "@/modules/customer/products/components/product-filters-skeleton";
import {
  PublicStoreView,
  fetchStoreBySlug,
} from "@/modules/customer/stores";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const store = await fetchStoreBySlug(slug);
    return {
      title: store.name,
      description:
        store.description?.slice(0, 160) ||
        `${store.name} on ${siteConfig.name}`,
    };
  } catch {
    return { title: "Store" };
  }
}

function StoreFallback() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-20 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <ProductFiltersSkeleton />
    </div>
  );
}

export default async function PublicStorePage({ params }: Props) {
  const { slug } = await params;
  try {
    const store = await fetchStoreBySlug(slug);
    return (
      <Suspense fallback={<StoreFallback />}>
        <PublicStoreView slug={slug} initialStore={store} />
      </Suspense>
    );
  } catch {
    notFound();
  }
}
