import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { AdminCategoriesList } from "@/modules/admin/categories";

export const metadata = {
  title: "Categories",
};

export default function CategoriesPage() {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Categories
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage product categories
          </p>
        </div>
        <div>
          <Link
            href={ROUTES.categoryNew}
            className={cn(buttonVariants({ size: "default" }))}
          >
            Create category
          </Link>
        </div>
      </header>

      <AdminCategoriesList />
    </div>
  );
}
