"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Order } from "../types";
import { ROUTES } from "@/constants/routes";
import { OrderSummary } from "./order-summary";
import { Download, Package } from "lucide-react";
import { formatOrderDate } from "@/lib/format-date";
import { Button, buttonVariants } from "@/components/ui/button";

type Props = {
  order: Order;
};

function estimatedDeliveryLabel(createdAt: string): string {
  const placed = new Date(createdAt);
  if (Number.isNaN(placed.getTime())) return "3–7 business days";
  const start = new Date(placed);
  start.setDate(start.getDate() + 3);
  const end = new Date(placed);
  end.setDate(end.getDate() + 7);
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function OrderSuccessCard({ order }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Package className="text-muted-foreground size-4" />
          <span className="text-muted-foreground">
            Estimated delivery {estimatedDeliveryLabel(order.createdAt)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={ROUTES.order(order.id)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View order
          </Link>
          <Button
            disabled
            size="sm"
            type="button"
            variant="ghost"
            title="Invoices coming soon"
          >
            <Download className="size-3.5" />
            Invoice
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Placed {formatOrderDate(order.createdAt)}
        {order.paymentMethodSummary ? ` · ${order.paymentMethodSummary}` : null}
      </p>
      <OrderSummary order={order} />
    </div>
  );
}
