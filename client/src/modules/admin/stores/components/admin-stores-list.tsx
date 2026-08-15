"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { Eye, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { queryKeys } from "@/constants/query-keys";
import { Pagination } from "@/components/ui/pagination";
import { STORE_STATUS_FILTER_OPTIONS } from "../constants";
import { AdminTableSkeleton } from "@/modules/admin/shared";
import { fetchAdminStores } from "../services/stores.service";
import { isStoreVerified } from "@/modules/seller/store/types";
import type { StoreStatus, StoreStatusFilter } from "../types";
import { Button, buttonVariants } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";

export function AdminStoresList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<StoreStatusFilter>("ALL");
  const debouncedSearch = useDebouncedValue(searchInput, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, perPage]);

  const { data, isPending, isFetching, isPlaceholderData, isError, refetch } =
    useQuery({
      queryKey: queryKeys.admin.stores.list({
        page,
        perPage,
        search: debouncedSearch,
        status: statusFilter,
      }),
      queryFn: () =>
        fetchAdminStores({
          page,
          limit: perPage,
          search: debouncedSearch || undefined,
          status:
            statusFilter === "ALL"
              ? undefined
              : (statusFilter as StoreStatus),
        }),
      placeholderData: (prev) => prev,
    });

  if (isPending && !data) {
    return (
      <AdminTableSkeleton
        filterWidths={["w-72", "w-40", "w-24"]}
        columns={[
          { className: "flex-1" },
          { className: "flex-1" },
          { className: "w-28" },
          { className: "w-28" },
          { className: "w-28" },
          { className: "w-24 shrink-0", isAction: true },
        ]}
      />
    );
  }

  if (isError && !data) {
    return (
      <EmptyState
        title="Could not load stores"
        description="Check your connection and try again."
        action={
          <Button type="button" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        }
      />
    );
  }

  if (!data) return null;

  const total = data.meta.totalItems ?? 0;
  const hasSearch = debouncedSearch.trim().length > 0;
  const hasStatusFilter = statusFilter !== "ALL";
  const isEmptyCatalog = total === 0 && !hasSearch && !hasStatusFilter;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="w-72">
          <Input
            value={searchInput}
            disabled={isEmptyCatalog}
            placeholder="Search name or slug"
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            value={statusFilter}
            disabled={isEmptyCatalog && statusFilter === "ALL"}
            onValueChange={(value) =>
              setStatusFilter((value ?? "ALL") as StoreStatusFilter)
            }
          >
            <SelectTrigger className="w-full!">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STORE_STATUS_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          onClick={() =>
            qc.invalidateQueries({ queryKey: queryKeys.admin.stores.all })
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
              <TableHead>Store</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Reputation</TableHead>
              <TableHead className="w-24 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  {hasSearch || hasStatusFilter
                    ? "No stores match your filters."
                    : "No stores yet."}
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium">{store.name}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {store.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {store.sellerProfile.businessName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        store.status === "ACTIVE" ? "default" : "destructive"
                      }
                    >
                      {store.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {isStoreVerified(store) ? "Verified" : "Unverified"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm tabular-nums">
                    {store.averageRating != null
                      ? `${store.averageRating.toFixed(1)} · ${store.totalReviews ?? 0} reviews`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Link
                        href={ROUTES.adminStore(store.id)}
                        aria-label={`View ${store.name}`}
                        className={cn(
                          buttonVariants({ size: "icon", variant: "outline" })
                        )}
                      >
                        <Eye className="size-4" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {total > 0 ? (
          <Pagination
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            totalPages={data.meta.totalPages || 1}
            onPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
