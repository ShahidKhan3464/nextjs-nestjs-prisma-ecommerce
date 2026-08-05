"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useIsSeller, useIsSuperAdmin } from "@/modules/auth";
import { SellerProductEditForm } from "@/modules/seller/products";
import { AdminProductUpdateForm } from "@/modules/admin/products";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchAdminProduct } from "@/modules/admin/products/services/products.service";
import { fetchSellerProduct } from "@/modules/seller/products/services/products.service";

export default function EditProductPage() {
  const params = useParams();
  const isSeller = useIsSeller();
  const isAdmin = useIsSuperAdmin();
  const raw = params?.id;
  const id = typeof raw === "string" ? raw : "";
  const numericId = Number(id);
  const enabled =
    Boolean(id) &&
    Number.isFinite(numericId) &&
    numericId > 0 &&
    (isAdmin || isSeller);

  const adminQuery = useQuery({
    queryKey:
      enabled && isAdmin
        ? queryKeys.admin.product(id)
        : queryKeys.admin.product("idle"),
    queryFn: () => fetchAdminProduct(id),
    enabled: enabled && isAdmin,
  });

  const sellerQuery = useQuery({
    queryKey: enabled && isSeller && !isAdmin
      ? queryKeys.seller.products.detail(id)
      : queryKeys.seller.products.detail("idle"),
    queryFn: () => fetchSellerProduct(id),
    enabled: enabled && isSeller && !isAdmin,
  });

  if (!isAdmin && !isSeller) {
    return (
      <EmptyState
        title="Access required"
        description="Only admins and sellers can edit products."
      />
    );
  }

  if (!enabled) {
    return <p className="text-muted-foreground text-sm">Invalid product.</p>;
  }

  if (isAdmin) {
    if (adminQuery.isPending) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-14 w-72" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      );
    }
    if (adminQuery.isError || !adminQuery.data) {
      return (
        <p className="text-muted-foreground text-sm">
          Could not load this product.
        </p>
      );
    }
    return (
      <div className="space-y-4">
        <header className="space-y-0.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Edit product
          </h1>
          <p className="text-muted-foreground text-sm">
            Update product details and variants, then save.
          </p>
        </header>
        <AdminProductUpdateForm initial={adminQuery.data} />
      </div>
    );
  }

  if (sellerQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (sellerQuery.isError || !sellerQuery.data) {
    return (
      <EmptyState
        title="Could not load product"
        description="This product may not belong to your store, or it was removed."
        action={
          <Link
            href={ROUTES.products}
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            Back to products
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href={ROUTES.productManage(id)}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 mb-1 h-auto"
        )}
      >
        ← Back to product
      </Link>
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Edit product
        </h1>
        <p className="text-muted-foreground text-sm">
          Update details, variants, and images for your listing.
        </p>
      </header>
      <SellerProductEditForm initial={sellerQuery.data} />
    </div>
  );
}
