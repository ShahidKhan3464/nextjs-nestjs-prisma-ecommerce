"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminCategoryForm } from "@/modules/admin/categories";
import { fetchAdminCategory } from "@/modules/admin/categories";

export default function EditCategoryPage() {
  const params = useParams();
  const raw = params?.id;
  const id = typeof raw === "string" ? Number(raw) : NaN;
  const enabled = Number.isFinite(id) && id > 0;

  const { data, isPending, isError } = useQuery({
    queryKey: enabled
      ? queryKeys.admin.category(id)
      : (["admin", "categories", "detail", "invalid"] as const),
    queryFn: () => fetchAdminCategory(id),
    enabled,
  });

  if (!enabled) {
    return <p className="text-muted-foreground text-sm">Invalid category.</p>;
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
        Could not load this category.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Edit category
        </h1>
        <p className="text-muted-foreground text-sm">
          Update name and description, then save.
        </p>
      </header>
      <AdminCategoryForm initial={data} />
    </div>
  );
}
