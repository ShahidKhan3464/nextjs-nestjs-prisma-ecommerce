import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { isSeller } from "@/modules/auth/utils/roles";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import { SellerProductsPage } from "@/modules/seller/products";
import { ProductsPageContent } from "@/modules/customer/products/components/products-page-content";

export const metadata: Metadata = {
  title: "Products",
  description: `Browse products — ${siteConfig.name}`,
};

export default async function ProductsPage() {
  const session = await getAccessTokenPayload();

  if (session && isSeller(session.roles)) {
    return <SellerProductsPage />;
  }

  return <ProductsPageContent />;
}
