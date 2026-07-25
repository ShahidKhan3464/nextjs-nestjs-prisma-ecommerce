import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { isSuperAdmin } from "@/modules/auth/utils/roles";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import { AdminProductsList } from "@/modules/admin/products";
import { ProductsPageContent } from "@/modules/customer/products/components/products-page-content";

export const metadata: Metadata = {
  title: "Products",
  description: `Browse products — ${siteConfig.name}`,
};

export default async function ProductsPage() {
  const session = await getAccessTokenPayload();

  if (session && isSuperAdmin(session.roles)) {
    return (
      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Products
            </h1>
            <p className="text-muted-foreground text-sm">
              Maintain your catalog—search inventory, refresh data, and add new
              listings when you are ready.
            </p>
          </div>
          <div>
            <Link
              href={ROUTES.productNew}
              className={cn(buttonVariants({ size: "default" }))}
            >
              Add product
            </Link>
          </div>
        </header>
        <AdminProductsList />
      </div>
    );
  }

  return <ProductsPageContent />;
}
