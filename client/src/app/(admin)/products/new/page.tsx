import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { AdminProductCreateForm } from "@/modules/admin/products";

export const metadata: Metadata = {
  title: "New product",
};

export default function NewProductPage() {
  return (
    <div className="w-full max-w-full space-y-4">
      <Link
        href={ROUTES.products}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 h-auto mb-3"
        )}
      >
        ← Back to products
      </Link>
      <div className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          New product
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Add images, pick a category, and set variant details (SKU, price,
          stock). The form aligns with the admin header above—full width of the
          main column.
        </p>
      </div>
      <AdminProductCreateForm />
    </div>
  );
}
