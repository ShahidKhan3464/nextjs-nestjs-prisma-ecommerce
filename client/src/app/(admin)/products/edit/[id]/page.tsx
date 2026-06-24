"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminProduct } from "@/modules/admin/products/services/products.service";
import { AdminProductUpdateForm } from "@/modules/admin/products/components/admin-product-update-form";

export default function EditProductPage() {
  const params = useParams();
  const raw = params?.id;
  const id = typeof raw === "string" ? Number(raw) : NaN;
  const enabled = Number.isFinite(id) && id > 0;

  const { data, isPending, isError } = useQuery({
    queryKey: enabled
      ? ["admin", "products", "detail", id]
      : (["admin", "products", "detail", "invalid"] as const),
    queryFn: () => fetchAdminProduct(id),
    enabled,
  });

  if (!enabled) {
    return <p className="text-muted-foreground text-sm">Invalid product.</p>;
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
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
      <AdminProductUpdateForm initial={data} />
    </div>
  );
}
