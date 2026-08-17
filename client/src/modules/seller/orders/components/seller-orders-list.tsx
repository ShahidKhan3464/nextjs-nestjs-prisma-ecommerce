"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { EyeIcon } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/constants/query-keys";
import { formatOrderDate } from "@/lib/format-date";
import { useEffect, useMemo, useState } from "react";
import type { SellerOrderListParams } from "../types";
import { Pagination } from "@/components/ui/pagination";
import { AdminTableSkeleton } from "@/modules/admin/shared";
import { fetchSellerOrders } from "../services/orders.service";
import { Button, buttonVariants } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/modules/buyer/orders/components/order-status-badges";
import {
  ORDER_STATUS_FILTER_OPTIONS,
  SELLER_PAYMENT_STATUS_FILTER_OPTIONS,
} from "@/modules/buyer/orders/constants";
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

export function SellerOrdersList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(searchInput, 500);
  const hasSearch = debouncedSearch.trim().length > 0;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, paymentFilter, perPage]);

  const listParams = useMemo(() => {
    const params: SellerOrderListParams = {};
    if (statusFilter !== "all") params.status = statusFilter;
    if (paymentFilter !== "all") params.paymentStatus = paymentFilter;
    if (hasSearch) {
      params.page = 1;
      params.limit = 100;
    } else {
      params.page = page;
      params.limit = perPage;
    }
    return params;
  }, [statusFilter, paymentFilter, hasSearch, page, perPage]);

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.seller.orders.list(listParams),
    queryFn: () => fetchSellerOrders(listParams),
  });

  const filtered = useMemo(() => {
    const orders = data?.orders ?? [];
    if (!hasSearch) return orders;
    const q = debouncedSearch.trim().toLowerCase();
    return orders.filter((o) => {
      const idMatch =
        o.id.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q);
      const buyerMatch =
        o.buyer?.fullName.toLowerCase().includes(q) ||
        o.buyer?.email.toLowerCase().includes(q);
      const itemMatch = o.items.some(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.variantLabel.toLowerCase().includes(q)
      );
      return idMatch || buyerMatch || itemMatch;
    });
  }, [data?.orders, debouncedSearch, hasSearch]);

  const totalPages = hasSearch
    ? Math.max(1, Math.ceil(filtered.length / perPage))
    : (data?.pagination.totalPages ?? 1);
  const pageClamped = Math.min(page, totalPages);
  const pageRows = hasSearch
    ? filtered.slice((pageClamped - 1) * perPage, pageClamped * perPage)
    : filtered;
  const paginationPage = hasSearch
    ? pageClamped
    : (data?.pagination.page ?? pageClamped);
  const paginationPerPage = hasSearch
    ? perPage
    : (data?.pagination.limit ?? perPage);

  useEffect(() => {
    if (page !== pageClamped) setPage(pageClamped);
  }, [page, pageClamped]);

  if (isPending) {
    return (
      <AdminTableSkeleton
        filterWidths={["w-72", "w-32", "w-32", "w-24"]}
        columns={[
          { className: "flex-1" },
          { className: "flex-1" },
          { className: "w-24" },
          { className: "w-24" },
          { className: "w-28" },
          { className: "w-24" },
          { className: "w-36 shrink-0", isAction: true },
        ]}
      />
    );
  }

  if (isError && !data) {
    return (
      <EmptyState
        title="Could not load orders"
        description="Something went wrong while fetching your store orders."
        action={
          <Button onClick={() => void refetch()} disabled={isFetching}>
            Retry
          </Button>
        }
      />
    );
  }

  const total = data?.pagination.total ?? 0;
  const hasFilters = statusFilter !== "all" || paymentFilter !== "all";
  const isEmptyCatalog = total === 0 && !hasSearch && !hasFilters;

  if (isEmptyCatalog) {
    return (
      <EmptyState
        title="No orders yet"
        description="Orders placed against your store will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="w-full sm:w-72">
          <Input
            value={searchInput}
            placeholder="Search orders, customers…"
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-[calc(50%-0.25rem)] sm:w-32">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value ?? "all")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Order status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[calc(50%-0.25rem)] sm:w-32">
          <Select
            value={paymentFilter}
            onValueChange={(value) => setPaymentFilter(value ?? "all")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              {SELLER_PAYMENT_STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            void qc.invalidateQueries({
              queryKey: queryKeys.seller.orders.all,
            })
          }
        >
          Refresh
        </Button>
      </div>

      <div
        className={
          isFetching ? "opacity-60 transition-opacity" : "transition-opacity"
        }
      >
        <Table>
          <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Payment</TableHead>
                <TableHead className="hidden lg:table-cell">Placed</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-20 text-center sm:w-36">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    No orders match your search or filters.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-mono text-sm">{order.orderNumber}</p>
                        <p className="text-muted-foreground text-xs md:hidden">
                          {order.buyer?.fullName ?? "Customer"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {order.buyer?.fullName ?? "—"}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {order.buyer?.email ?? ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm tabular-nums lg:table-cell">
                      {formatOrderDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      ${order.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Link
                        href={ROUTES.order(order.id)}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "icon" })
                        )}
                        aria-label={`View order ${order.orderNumber}`}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

        {(data?.pagination.total ?? 0) > 0 || filtered.length > 0 ? (
          <Pagination
            page={paginationPage}
            onPageChange={setPage}
            totalPages={totalPages}
            perPage={paginationPerPage}
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
