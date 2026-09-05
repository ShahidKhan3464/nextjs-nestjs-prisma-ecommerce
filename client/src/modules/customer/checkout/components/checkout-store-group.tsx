"use client";

import Image from "next/image";
import { formatMoney } from "../utils/format-money";
import {
  StoreGroupHeader,
  type StoreCartGroup,
} from "@/modules/buyer/shared";

type Props = {
  group: StoreCartGroup;
  compact?: boolean;
};

export function CheckoutStoreGroup({ group, compact = false }: Props) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <StoreGroupHeader store={group.store} compact={compact} />
      <ul className="space-y-3">
        {group.items.map((item) => (
          <li key={item.variantId} className="flex gap-3 text-sm">
            <span className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-md border">
              {item.image ? (
                <Image
                  fill
                  alt=""
                  sizes="48px"
                  src={item.image}
                  className="object-cover"
                />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 font-medium">{item.name}</span>
              {item.variantLabel ? (
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  {item.variantLabel}
                </span>
              ) : null}
              <span className="text-muted-foreground mt-0.5 block text-xs">
                Qty {item.quantity}
              </span>
            </span>
            <span className="shrink-0 tabular-nums">
              {formatMoney(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <div className="space-y-1 border-t pt-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Store subtotal</span>
          <span className="tabular-nums">{formatMoney(group.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground text-xs tabular-nums">
            Calculated by store
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span className="text-muted-foreground text-xs tabular-nums">
            Included in total
          </span>
        </div>
      </div>
    </div>
  );
}
