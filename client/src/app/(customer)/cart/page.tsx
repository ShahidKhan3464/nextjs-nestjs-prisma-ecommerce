import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { CartPageView } from "@/modules/buyer/cart";

export const metadata: Metadata = {
  title: "Cart",
  description: `Shopping cart — ${siteConfig.name}`,
};

export default function CartPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Cart
        </h1>
        <p className="text-muted-foreground text-sm">
          Review items from each store before checkout.
        </p>
      </header>
      <CartPageView />
    </div>
  );
}
