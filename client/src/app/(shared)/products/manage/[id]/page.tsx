import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { SellerProductDetail } from "@/modules/seller/products";

export const metadata: Metadata = {
  title: "Product details",
};

type Props = { params: Promise<{ id: string }> };

export default async function SellerProductManagePage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <Link
        href={ROUTES.products}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 mb-1 h-auto"
        )}
      >
        ← Back to products
      </Link>
      <SellerProductDetail productId={id} />
    </div>
  );
}
