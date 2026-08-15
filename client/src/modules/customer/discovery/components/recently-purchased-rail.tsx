"use client";

import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/constants/routes";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchBuyerDashboard } from "@/modules/buyer/dashboard/services/dashboard.service";

type Props = {
  limit?: number;
  className?: string;
};

export function RecentlyPurchasedRail({ limit = 8, className }: Props) {
  const user = useAuthStore((s) => s.user);

  const { data, isPending } = useQuery({
    queryKey: queryKeys.dashboard.buyer,
    queryFn: fetchBuyerDashboard,
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  const items = (data?.recentlyPurchased ?? []).slice(0, limit);

  if (!user) return null;
  if (!isPending && items.length === 0) return null;

  return (
    <section className={className}>
      <header className="mb-4 space-y-0.5">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Recently purchased
        </h2>
        <p className="text-muted-foreground text-sm">
          Revisit products from your recent orders.
        </p>
      </header>

      {isPending ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="size-24 shrink-0 rounded-xl" />
          ))}
        </div>
      ) : (
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => (
            <li key={`${item.productId}-${item.purchasedAt}`}>
              <Link
                href={ROUTES.product(item.slug)}
                className="group flex w-28 flex-col gap-2"
              >
                <div className="border-border relative size-24 overflow-hidden rounded-xl border bg-muted/40">
                  <Image
                    fill
                    alt=""
                    sizes="96px"
                    src={item.imageUrl ?? "/placeholder.svg"}
                    className="object-cover transition group-hover:scale-105"
                  />
                </div>
                <span className="line-clamp-2 text-xs font-medium leading-snug">
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
