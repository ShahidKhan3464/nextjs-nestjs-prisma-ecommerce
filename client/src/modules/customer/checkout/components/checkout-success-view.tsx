"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { Order } from "../types";
import { motion } from "framer-motion";
import { ROUTES } from "@/constants/routes";
import { formatMoney } from "../utils/format-money";
import { OrderSuccessCard } from "./order-success-card";
import { buttonVariants } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { CheckoutSuccessSkeleton } from "./checkout-skeletons";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import {
  clearCheckoutSuccess,
  loadCheckoutSuccess,
} from "../utils/checkout-session-storage";

export function CheckoutSuccessView() {
  const [ready, setReady] = React.useState(false);
  const [orders, setOrders] = React.useState<Order[] | null>(null);

  React.useEffect(() => {
    const snapshot = loadCheckoutSuccess();
    setOrders(snapshot?.orders ?? null);
    setReady(true);
  }, []);

  React.useEffect(() => {
    return () => {
      // Keep snapshot available for refresh within TTL; clear only on leave to shopping/orders via CTAs if desired.
    };
  }, []);

  if (!ready) {
    return <CheckoutSuccessSkeleton />;
  }

  if (!orders?.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="No recent order confirmation"
          description="Your payment may still be processing, or this confirmation expired. Check your orders for the latest status."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href={ROUTES.orders}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Go to orders
              </Link>
              <Link
                href={ROUTES.products}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Continue shopping
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const grandTotal = orders.reduce((sum, o) => sum + o.total, 0);
  const storeCount = new Set(orders.map((o) => o.storeId ?? o.store?.id)).size;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 lg:px-6">
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-9" />
        </motion.div>
        <motion.h1
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="font-heading text-3xl font-semibold tracking-tight"
        >
          Order confirmed
        </motion.h1>
        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed"
        >
          You placed {orders.length} order{orders.length === 1 ? "" : "s"} across{" "}
          {storeCount} store{storeCount === 1 ? "" : "s"}. Total charged{" "}
          {formatMoney(grandTotal)}.
        </motion.p>
      </div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="space-y-6"
      >
        {orders.map((order) => (
          <OrderSuccessCard key={order.id} order={order} />
        ))}
      </motion.div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={ROUTES.orders}
          onClick={() => clearCheckoutSuccess()}
          className={cn(buttonVariants({ size: "lg" }))}
        >
          Go to orders
        </Link>
        <Link
          href={ROUTES.products}
          onClick={() => clearCheckoutSuccess()}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          <ShoppingBag className="size-4" />
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
