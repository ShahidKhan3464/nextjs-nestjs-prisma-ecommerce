"use client";

import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/constants/query-keys";
import type { AdminCategoryOption } from "../types";
import { getApiErrorMessage } from "@/lib/api-error";
import { Pagination } from "@/components/ui/pagination";
import { Pencil, Trash2, RotateCcw } from "lucide-react";
import { AdminTableSkeleton } from "@/modules/admin/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminCategory,
  fetchAdminCategories,
  restoreAdminCategory,
} from "../services/categories.service";
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
  TableCell,
  TableBody,
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

export function AdminCategoriesList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 500);
  const [statusFilter, setStatusFilter] = useState<
    "active" | "removed" | "all"
  >("active");
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryOption | null>(
    null
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data, isPending, isFetching, isPlaceholderData } = useQuery({
    queryKey: [
      ...queryKeys.admin.categories,
      { search: debouncedSearch, page, perPage, lifeCycle: statusFilter },
    ] as const,
    queryFn: () =>
      fetchAdminCategories({
        limit: perPage,
        search: debouncedSearch || undefined,
        page,
        lifeCycle: statusFilter,
      }),
    placeholderData: (prev) => prev,
  });

  const remove = useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: async () => {
      toast.success("Category removed");
      setDeleteTarget(null);
      await qc.invalidateQueries({ queryKey: queryKeys.admin.categories });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not delete category")),
  });

  const restore = useMutation({
    mutationFn: restoreAdminCategory,
    onSuccess: async () => {
      toast.success("Category restored");
      await qc.invalidateQueries({ queryKey: queryKeys.admin.categories });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not restore category")),
  });

  const showInitialSkeleton = isPending && !data;

  if (showInitialSkeleton) {
    return (
      <AdminTableSkeleton
        filterWidths={["w-72", "w-32", "w-24"]}
        columns={[
          { className: "flex-1" },
          { className: "flex-1 max-w-md" },
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
              placeholder="Search categories"
              aria-busy={isFetching && !isPlaceholderData}
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
              qc.invalidateQueries({ queryKey: queryKeys.admin.categories })
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
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-28 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.categories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                data.categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate text-sm">
                      {c.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          aria-label={`Edit ${c.name}`}
                          href={ROUTES.category(String(c.id))}
                          className={cn(
                            buttonVariants({ size: "icon", variant: "outline" })
                          )}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        {c.isRemoved ? (
                          <Button
                            size="icon"
                            variant="outline"
                            disabled={restore.isPending}
                            aria-label={`Restore ${c.name}`}
                            onClick={() => restore.mutate(c.id)}
                          >
                            <RotateCcw className="size-4" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="destructive"
                            aria-label={`Remove ${c.name}`}
                            onClick={() => setDeleteTarget(c)}
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
            <AlertDialogTitle>Remove category?</AlertDialogTitle>
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
