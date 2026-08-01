"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useIsSeller } from "@/modules/auth";
import { buttonVariants } from "@/components/ui/button";
import { SellerProductsList } from "./seller-products-list";
import { EmptyState } from "@/shared/components/feedback/empty-state";

export function SellerProductsPage() {
  const isSeller = useIsSeller();

  if (!isSeller) {
    return (
      <EmptyState
        title="Seller access required"
        description="Only approved sellers can manage store products."
      />
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Products
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage listings for your store—draft, publish, archive, and restore.
          </p>
        </div>
        <Link
          href={ROUTES.productNew}
          className={cn(buttonVariants({ size: "default" }), "self-start")}
        >
          Add product
        </Link>
      </header>
      <SellerProductsList />
    </div>
  );
}
