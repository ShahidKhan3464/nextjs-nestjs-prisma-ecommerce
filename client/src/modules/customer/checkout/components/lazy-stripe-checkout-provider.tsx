"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Lazy-loaded Stripe Elements shell so the payment SDK is code-split
 * from the shipping step.
 */
export const LazyStripeCheckoutProvider = dynamic(
  () =>
    import("./stripe-checkout-provider").then((m) => m.StripeCheckoutProvider),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    ),
  }
);
