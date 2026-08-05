"use client";

import type { CheckoutPreview } from "../types";
import { PriceBreakdown } from "./price-breakdown";
import { Separator } from "@/components/ui/separator";
import { CheckoutStoreGroup } from "./checkout-store-group";
import type { StoreCartGroup } from "@/modules/customer/shared";

type Props = {
  title?: string;
  groups: StoreCartGroup[];
  merchandiseSubtotal: number;
  preview: CheckoutPreview | null;
};

export function CheckoutSummary({
  groups,
  merchandiseSubtotal,
  preview,
  title = "Order summary",
}: Props) {
  return (
    <aside className="bg-muted/40 border-border h-fit space-y-4 rounded-xl border p-6 lg:sticky lg:top-28">
      <p className="font-medium">{title}</p>
      <div className="space-y-4">
        {groups.map((group) => (
          <CheckoutStoreGroup key={group.storeKey} group={group} compact />
        ))}
      </div>
      <Separator />
      <PriceBreakdown
        preview={preview}
        merchandiseSubtotal={merchandiseSubtotal}
      />
    </aside>
  );
}
