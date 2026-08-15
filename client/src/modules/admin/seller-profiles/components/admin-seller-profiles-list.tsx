"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { Eye, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/constants/query-keys";
import { Pagination } from "@/components/ui/pagination";
import { SELLER_STATUS_FILTER_OPTIONS } from "../constants";
import { AdminTableSkeleton } from "@/modules/admin/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import type { SellerProfileStatus, SellerProfileStatusFilter } from "../types";
import { fetchAdminSellerProfiles } from "../services/seller-profiles.service";
import { SellerStatusBadge } from "@/modules/buyer/seller-registration/components/seller-status-badge";
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

export function AdminSellerProfilesList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<SellerProfileStatusFilter>("PENDING");
  const debouncedSearch = useDebouncedValue(searchInput, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const statusParam =
    statusFilter === "ALL" ? undefined : (statusFilter as SellerProfileStatus);

  const { data, isPending, isFetching, isPlaceholderData, isError, refetch } =
    useQuery({
      queryKey: [
        ...queryKeys.admin.sellerProfiles,
        {
          search: debouncedSearch,
          page,
          perPage,
          status: statusFilter,
        },
      ] as const,
      queryFn: () =>
        fetchAdminSellerProfiles({
          limit: perPage,
          page,
          search: debouncedSearch || undefined,
          status: statusParam,
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
          { className: "flex-1" },
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
        title="Could not load seller applications"
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

  if (!data) {
    return null;
  }

  const total = data.meta.totalItems ?? 0;
  const hasSearch = debouncedSearch.trim().length > 0;
  const hasStatusFilter = statusFilter !== "ALL";
  const isEmptyCatalog = total === 0 && !hasSearch && !hasStatusFilter;
  const showPagination = total > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="w-72">
          <Input
            value={searchInput}
            disabled={isEmptyCatalog}
            placeholder="Search business name or email"
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            value={statusFilter}
            disabled={isEmptyCatalog && statusFilter === "ALL"}
            onValueChange={(value) =>
              setStatusFilter((value ?? "ALL") as SellerProfileStatusFilter)
            }
          >
            <SelectTrigger className="w-full!" disabled={isEmptyCatalog && statusFilter === "ALL"}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {SELLER_STATUS_FILTER_OPTIONS.map((opt) => (
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
            qc.invalidateQueries({ queryKey: queryKeys.admin.sellerProfiles })
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
              <TableHead>Business</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Status</TableHead>
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
                    ? "No seller applications match your filters."
                    : "No seller applications yet."}
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    {profile.businessName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {profile.businessEmail}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {profile.businessPhone}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm tabular-nums">
                    {format(new Date(profile.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <SellerStatusBadge status={profile.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Link
                        href={ROUTES.sellerProfile(profile.id)}
                        aria-label={`View ${profile.businessName}`}
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

        {showPagination ? (
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
