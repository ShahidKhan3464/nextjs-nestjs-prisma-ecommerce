"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/constants/query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import { Pagination } from "@/components/ui/pagination";
import { ProductStatusBadge } from "./product-status-badge";
import { AdminTableSkeleton } from "@/modules/admin/shared";
import { formatFilterLabel } from "@/lib/format-filter-label";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { fetchSellerCategories } from "../services/categories.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Eye,
  Pencil,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import type {
  ProductLifeCycle,
  ProductStatus,
  SellerProduct,
  SellerProductListResult,
} from "../types";
import {
  canArchiveProduct,
  canPublishProduct,
  canRestoreProduct,
} from "../types";
import {
  archiveSellerProduct,
  deleteSellerProduct,
  fetchSellerProducts,
  publishSellerProduct,
  restoreSellerProduct,
} from "../services/products.service";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

function ProductThumb({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = React.useState(false);

  return (
    <div className="relative size-10 overflow-hidden rounded-md bg-muted">
      <Image
        fill
        alt={alt}
        sizes="40px"
        className="object-cover"
        onError={() => setFailed(true)}
        src={failed ? "/placeholder.svg" : src}
      />
    </div>
  );
}

function patchListProduct(
  data: SellerProductListResult | undefined,
  id: string,
  patch: Partial<SellerProduct>
): SellerProductListResult | undefined {
  if (!data) return data;
  return {
    ...data,
    products: data.products.map((p) =>
      p.id === id ? { ...p, ...patch } : p
    ),
  };
}

export function SellerProductsList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 500);
  const [lifeCycle, setLifeCycle] = useState<ProductLifeCycle>("active");
  const [deleteTarget, setDeleteTarget] = useState<SellerProduct | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">(
    "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, lifeCycle, statusFilter, categoryFilter]);

  const listKey = [
    ...queryKeys.seller.products.all,
    {
      page,
      perPage,
      search: debouncedSearch,
      lifeCycle,
      status: statusFilter,
      categoryId: categoryFilter,
    },
  ] as const;

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.seller.categories,
    queryFn: () => fetchSellerCategories({ limit: 200 }),
  });

  const { data, isPending, isFetching, isPlaceholderData, isError, error, refetch } =
    useQuery({
      queryKey: listKey,
      queryFn: () =>
        fetchSellerProducts({
          page,
          limit: perPage,
          lifeCycle,
          search: debouncedSearch || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          categoryId:
            categoryFilter === "all" ? undefined : Number(categoryFilter),
        }),
      placeholderData: (prev) => prev,
    });

  const invalidateLists = async () => {
    await qc.invalidateQueries({ queryKey: queryKeys.seller.products.all });
  };

  const publish = useMutation({
    mutationFn: publishSellerProduct,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.seller.products.all });
      const previous = qc.getQueryData<SellerProductListResult>(listKey);
      qc.setQueryData(
        listKey,
        patchListProduct(previous, id, { status: "ACTIVE" })
      );
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(listKey, ctx.previous);
      toast.error(getApiErrorMessage(err, "Could not publish product"));
    },
    onSuccess: async (product) => {
      toast.success("Product published");
      if (product) {
        qc.setQueryData(queryKeys.seller.products.detail(product.id), product);
      }
      await invalidateLists();
    },
  });

  const archive = useMutation({
    mutationFn: archiveSellerProduct,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.seller.products.all });
      const previous = qc.getQueryData<SellerProductListResult>(listKey);
      qc.setQueryData(
        listKey,
        patchListProduct(previous, id, { status: "ARCHIVED" })
      );
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(listKey, ctx.previous);
      toast.error(getApiErrorMessage(err, "Could not archive product"));
    },
    onSuccess: async (product) => {
      toast.success("Product archived");
      if (product) {
        qc.setQueryData(queryKeys.seller.products.detail(product.id), product);
      }
      await invalidateLists();
    },
  });

  const restore = useMutation({
    mutationFn: restoreSellerProduct,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.seller.products.all });
      const previous = qc.getQueryData<SellerProductListResult>(listKey);
      qc.setQueryData(
        listKey,
        patchListProduct(previous, id, {
          isRemoved: false,
          status: "ACTIVE",
        })
      );
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(listKey, ctx.previous);
      toast.error(getApiErrorMessage(err, "Could not restore product"));
    },
    onSuccess: async (product) => {
      toast.success("Product restored");
      if (product) {
        qc.setQueryData(queryKeys.seller.products.detail(product.id), product);
      }
      await invalidateLists();
    },
  });

  const remove = useMutation({
    mutationFn: deleteSellerProduct,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.seller.products.all });
      const previous = qc.getQueryData<SellerProductListResult>(listKey);
      if (previous) {
        qc.setQueryData(listKey, {
          ...previous,
          products: previous.products.filter((p) => p.id !== id),
          pagination: {
            ...previous.pagination,
            total: Math.max(0, previous.pagination.total - 1),
          },
        });
      }
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(listKey, ctx.previous);
      toast.error(getApiErrorMessage(err, "Could not delete product"));
    },
    onSuccess: async () => {
      toast.success("Product removed");
      setDeleteTarget(null);
      await invalidateLists();
    },
  });

  if (isPending && !data) {
    return (
      <AdminTableSkeleton
        filterWidths={["w-56", "w-32", "w-32", "w-36", "w-24"]}
        columns={[
          { className: "w-16 shrink-0" },
          { className: "flex-1" },
          { className: "w-28" },
          { className: "w-24" },
          { className: "w-20" },
          { className: "w-40 shrink-0", isAction: true },
        ]}
      />
    );
  }

  if (isError && !data) {
    return (
      <EmptyState
        title="Could not load products"
        description={getApiErrorMessage(error, "Please try again.")}
        action={
          <Button size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!data) return null;

  const total = data.pagination?.total ?? 0;
  const hasSearch = debouncedSearch.trim().length > 0;
  const hasFilters =
    lifeCycle !== "active" ||
    statusFilter !== "all" ||
    categoryFilter !== "all";
  const isEmptyCatalog = total === 0 && !hasSearch && !hasFilters;

  if (isEmptyCatalog) {
    return (
      <EmptyState
        title="No products yet"
        description="Create your first listing to start selling from your store."
        action={
          <Link
            href={ROUTES.productNew}
            className={cn(buttonVariants({ size: "default" }))}
          >
            Add product
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="w-full sm:w-56">
            <Input
              value={searchInput}
              placeholder="Search products"
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-36">
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                if (val) setCategoryFilter(val);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {formatFilterLabel(c.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-32">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                if (val) setStatusFilter(val as ProductStatus | "all");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-32">
            <Select
              value={lifeCycle}
              onValueChange={(val) => {
                if (val) setLifeCycle(val as ProductLifeCycle);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Lifecycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">In catalog</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              void qc.invalidateQueries({
                queryKey: queryKeys.seller.products.all,
              })
            }
          >
            Refresh
          </Button>
        </div>

        <div
          className={
            isFetching && !isPlaceholderData
              ? "opacity-60 transition-opacity"
              : ""
          }
        >
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16" />
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Category
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Variants
                  </TableHead>
                  <TableHead className="w-40 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-10 text-center text-sm"
                    >
                      No products match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <ProductThumb
                          alt={p.name}
                          src={p.images[0]?.url ?? "/placeholder.svg"}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={ROUTES.productManage(p.id)}
                          className="font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                        {formatFilterLabel(p.category) || "—"}
                      </TableCell>
                      <TableCell>
                        <ProductStatusBadge product={p} />
                      </TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">
                        {p.variants.length}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={ROUTES.productManage(p.id)}
                            className={cn(
                              buttonVariants({
                                variant: "outline",
                                size: "icon",
                              })
                            )}
                            aria-label={`View ${p.name}`}
                          >
                            <Eye className="size-4" />
                          </Link>
                          {!p.isRemoved ? (
                            <Link
                              href={ROUTES.productEdit(p.id)}
                              className={cn(
                                buttonVariants({
                                  variant: "outline",
                                  size: "icon",
                                })
                              )}
                              aria-label={`Edit ${p.name}`}
                            >
                              <Pencil className="size-4" />
                            </Link>
                          ) : null}
                          {canPublishProduct(p) ? (
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={publish.isPending}
                              aria-label={`Publish ${p.name}`}
                              onClick={() => publish.mutate(p.id)}
                            >
                              <Upload className="size-4" />
                            </Button>
                          ) : null}
                          {canArchiveProduct(p) ? (
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={archive.isPending}
                              aria-label={`Archive ${p.name}`}
                              onClick={() => archive.mutate(p.id)}
                            >
                              <Archive className="size-4" />
                            </Button>
                          ) : null}
                          {canRestoreProduct(p) ? (
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={restore.isPending}
                              aria-label={`Restore ${p.name}`}
                              onClick={() => restore.mutate(p.id)}
                            >
                              <RotateCcw className="size-4" />
                            </Button>
                          ) : null}
                          {!p.isRemoved ? (
                            <Button
                              size="icon"
                              variant="destructive"
                              aria-label={`Remove ${p.name}`}
                              onClick={() => setDeleteTarget(p)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {total > 0 ? (
            <Pagination
              page={page}
              perPage={perPage}
              onPageChange={(p) => setPage(p)}
              totalPages={data.pagination?.totalPages ?? 1}
              onPerPageChange={(n) => {
                setPerPage(n);
                setPage(1);
              }}
            />
          ) : null}
        </div>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.name}" will be removed from your catalog. You can restore it later from the Removed filter.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (deleteTarget) remove.mutate(deleteTarget.id);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
