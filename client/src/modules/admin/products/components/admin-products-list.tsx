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
import { Pencil, Trash2, RotateCcw } from "lucide-react";
import { AdminTableSkeleton } from "@/modules/admin/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Product } from "@/modules/customer/products/types";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminProduct,
  fetchAdminProducts,
  restoreAdminProduct,
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

export function AdminProductsList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 500);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "active" | "removed" | "all"
  >("active");

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data, isPending, isFetching, isPlaceholderData } = useQuery({
    queryKey: [
      ...queryKeys.admin.products,
      { page, perPage, search: debouncedSearch, lifeCycle: statusFilter },
    ] as const,
    queryFn: () =>
      fetchAdminProducts({
        page,
        limit: perPage,
        lifeCycle: statusFilter,
        search: debouncedSearch || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const remove = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: async () => {
      toast.success("Product removed");
      setDeleteTarget(null);
      await qc.invalidateQueries({ queryKey: queryKeys.admin.products });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not delete product")),
  });

  const restore = useMutation({
    mutationFn: restoreAdminProduct,
    onSuccess: async () => {
      toast.success("Product restored");
      await qc.invalidateQueries({ queryKey: queryKeys.admin.products });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not restore product")),
  });

  const showInitialSkeleton = isPending && !data;

  if (showInitialSkeleton) {
    return (
      <AdminTableSkeleton
        filterWidths={["w-72", "w-32", "w-24"]}
        columns={[
          { className: "w-16 shrink-0" },
          { className: "flex-1" },
          { className: "flex-1" },
          { className: "w-20" },
          { className: "w-28 shrink-0", isAction: true },
        ]}
      />
    );
  }

  if (!data) {
    return null;
  }

  const total = data.pagination?.total ?? 0;
  const hasSearch = debouncedSearch.trim().length > 0;
  const hasStatusFilter = statusFilter !== "active";
  const isEmptyCatalog = total === 0 && !hasSearch && !hasStatusFilter;
  const showPagination = total > 0;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <div className="w-72">
            <Input
              value={searchInput}
              disabled={isEmptyCatalog}
              placeholder="Search products"
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="w-32">
            <Select
              value={statusFilter}
              disabled={isEmptyCatalog}
              onValueChange={(val) => {
                if (val) setStatusFilter(val);
              }}
            >
              <SelectTrigger className="w-full" disabled={isEmptyCatalog}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() =>
              qc.invalidateQueries({ queryKey: queryKeys.admin.products })
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16" />
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead className="w-28 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                data.products.map((p: Product) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <ProductThumb alt={p.name} src={p.images[0]} />
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.category}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {p.variants.length}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={ROUTES.productEdit(p.id)}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "icon" })
                          )}
                          aria-label={`Edit ${p.name}`}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        {p.isRemoved ? (
                          <Button
                            size="icon"
                            variant="outline"
                            aria-label={`Restore ${p.name}`}
                            disabled={restore.isPending}
                            onClick={() => restore.mutate(p.id)}
                          >
                            <RotateCcw className="size-4" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="destructive"
                            aria-label={`Remove ${p.name}`}
                            onClick={() => setDeleteTarget(p)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {showPagination ? (
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
                ? `"${deleteTarget.name}" will be removed from the catalog. You can restore it later from the Removed filter.`
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
