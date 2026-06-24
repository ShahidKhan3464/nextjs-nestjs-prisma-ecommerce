import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { WishlistGrid } from "@/modules/customer/wishlist";

export const metadata: Metadata = {
  title: "Wishlist",
  description: `Saved products — ${siteConfig.name}`,
};

export default function WishlistPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Wishlist
        </h1>
        <p className="text-muted-foreground text-sm">
          Save pieces you love and come back when you are ready to decide.
        </p>
      </header>
      <WishlistGrid />
    </div>
  );
}
