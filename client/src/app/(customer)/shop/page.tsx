import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ProductsPageContent } from "@/modules/buyer/products/components/products-page-content";

export const metadata: Metadata = {
  title: "Shop",
  description: `Browse products — ${siteConfig.name}`,
};

export default function ShopPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Shop
        </h1>
        <p className="text-muted-foreground text-sm">
          Browse the marketplace and add items to your cart.
        </p>
      </header>
      <ProductsPageContent />
    </div>
  );
}
