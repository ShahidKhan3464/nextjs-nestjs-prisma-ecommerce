import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import { AdminProductCreateForm } from "@/modules/admin/products";
import { SellerProductCreateForm } from "@/modules/seller/products";
import { isSeller, isSuperAdmin } from "@/modules/auth/utils/roles";

export const metadata: Metadata = {
  title: "New product",
};

export default async function NewProductPage() {
  const session = await getAccessTokenPayload();
  const roles = session?.roles ?? [];

  if (!isSuperAdmin(roles) && !isSeller(roles)) {
    redirect(ROUTES.dashboard);
  }

  const isAdmin = isSuperAdmin(roles);

  return (
    <div className="w-full max-w-full space-y-4">
      <Link
        href={ROUTES.products}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 mb-3 h-auto"
        )}
      >
        ← Back to products
      </Link>
      <div className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          New product
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          {isAdmin
            ? "Add images, pick a category, and set variant details (SKU, price, stock)."
            : "Create a listing for your store. Products are saved to your store automatically—no store ID needed."}
        </p>
      </div>
      {isAdmin ? <AdminProductCreateForm /> : <SellerProductCreateForm />}
    </div>
  );
}
