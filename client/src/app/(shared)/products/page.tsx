import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";
import { isSeller } from "@/modules/auth/utils/roles";
import { buttonVariants } from "@/components/ui/button";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import { SellerProductsPage } from "@/modules/seller/products";
import { ProductsPageContent } from "@/modules/buyer/products/components/products-page-content";

export const metadata: Metadata = {
  title: "Products",
  description: `Browse products — ${siteConfig.name}`,
};

export default async function ProductsPage() {
  const session = await getAccessTokenPayload();

  if (session && isSeller(session.roles)) {
    return (
      <div className="space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Products
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage listings for your store—draft, publish, archive, and
              restore.
            </p>
          </div>
          <Link
            href={ROUTES.productNew}
            className={cn(buttonVariants({ size: "default" }), "self-start")}
          >
            Add product
          </Link>
        </header>
        <SellerProductsPage />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Products
        </h1>
        <p className="text-muted-foreground text-sm">
          Browse our catalog and find the perfect product for you.
        </p>
      </header>
      <ProductsPageContent />
    </div>
  );
}
