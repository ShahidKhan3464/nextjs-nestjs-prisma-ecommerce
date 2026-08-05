"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { ROUTES } from "@/constants/routes";
import { useCartStore } from "@/store/cart-store";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCartHydrate } from "@/shared/hooks/use-cart-hydrate";
import { cartRemoveItem, cartUpdateQty } from "@/lib/cart-actions";
import { ContinueShoppingCta } from "@/modules/customer/discovery";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import {
  StoreGroupHeader,
  groupCartItemsByStore,
} from "@/modules/customer/shared";

function CartPageHeader() {
  return (
    <header className="space-y-0.5">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Cart
      </h1>
      <p className="text-muted-foreground text-sm">
        Review items from each store before checkout.
      </p>
    </header>
  );
}

export function CartPageView() {
  useCartHydrate();
  const items = useCartStore((s) => s.items);

  const { groups, grandTotal } = useMemo(
    () => groupCartItemsByStore(items),
    [items]
  );

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <CartPageHeader />
        <EmptyState
          title="Your cart is empty"
          description="Browse the catalog and add items you love."
          action={
            <Link href={ROUTES.products} className={cn(buttonVariants())}>
              Browse products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CartPageHeader />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {groups.map((group) => (
            <section
              key={group.storeKey}
              className="space-y-3 rounded-xl border p-4"
            >
              <StoreGroupHeader
                store={group.store}
                trailing={
                  <p className="text-sm font-medium tabular-nums">
                    Subtotal ${group.subtotal.toFixed(2)}
                  </p>
                }
              />
              <Separator />
              <ul className="divide-y">
                {group.items.map((item) => (
                  <li
                    key={item.variantId}
                    className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0 sm:flex-nowrap"
                  >
                    <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        fill
                        alt=""
                        sizes="96px"
                        src={item.image}
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={ROUTES.product(item.slug)}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-muted-foreground text-sm">
                        {item.variantLabel}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <div className="flex items-center rounded-md border">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="rounded-none"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              void cartUpdateQty(
                                item.variantId,
                                item.quantity - 1
                              )
                            }
                          >
                            <Minus className="size-3.5" />
                          </Button>
                          <span className="tabular-nums px-3 text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="rounded-none"
                            aria-label="Increase quantity"
                            onClick={() =>
                              void cartUpdateQty(
                                item.variantId,
                                item.quantity + 1
                              )
                            }
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          className="text-muted-foreground"
                          onClick={() => void cartRemoveItem(item.variantId)}
                        >
                          <Trash2 className="mr-1 size-4" /> Remove
                        </Button>
                      </div>
                    </div>
                    <p className="text-base font-medium tabular-nums sm:ml-auto">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="bg-muted/40 border-border h-fit space-y-4 rounded-xl border p-4 lg:sticky lg:top-28">
          <p className="font-medium">Summary</p>
          <Separator />
          <div className="space-y-2 text-sm">
            {groups.map((group) => (
              <div key={group.storeKey} className="flex justify-between gap-3">
                <span className="text-muted-foreground truncate">
                  {group.store?.name ?? "Sellers"}
                </span>
                <span className="tabular-nums">
                  ${group.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex justify-between text-sm font-semibold">
            <span>Grand total</span>
            <span className="tabular-nums">${grandTotal.toFixed(2)}</span>
          </div>
          {/* Coupon hook — when coupon APIs land, mount here without regrouping. */}
          <Link
            href={ROUTES.checkout}
            className={cn(
              buttonVariants(),
              "inline-flex w-full justify-center"
            )}
          >
            Proceed to checkout
          </Link>
          <ContinueShoppingCta className="w-full" />
        </aside>
      </div>
    </div>
  );
}
