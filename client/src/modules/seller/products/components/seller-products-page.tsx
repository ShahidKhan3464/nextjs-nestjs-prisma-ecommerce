"use client";

import { useIsSeller } from "@/modules/auth";
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

  return <SellerProductsList />;
}
