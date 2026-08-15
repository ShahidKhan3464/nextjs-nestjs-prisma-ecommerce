"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { EyeIcon } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import type { OrderListParams } from "../types";
import { queryKeys } from "@/constants/query-keys";
import { formatOrderDate } from "@/lib/format-date";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { AdminTableSkeleton } from "@/modules/admin/shared";
import { fetchAdminOrders } from "../services/orders.service";
import { Button, buttonVariants } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/modules/buyer/orders/components/order-status-badges";
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

const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
] as const;

export function AdminOrdersList() {
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
    const params: OrderListParams = {};
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

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.admin.orders(listParams),
    queryFn: () => fetchAdminOrders(listParams),
  });

  const filtered = useMemo(() => {
    const orders = data?.orders ?? [];
    if (!hasSearch) return orders;
    const q = debouncedSearch.trim().toLowerCase();
    return orders.filter((o) => {
      return (
        o.id.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q)
      );
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

  if (isPending && !data) {
    return (
      <AdminTableSkeleton
        filterWidths={["w-72", "w-32", "w-32", "w-24"]}
        columns={[
          { className: "flex-1" },
          { className: "w-24" },
          { className: "w-24" },
          { className: "flex-1" },
          { className: "w-24" },
          { className: "w-36 shrink-0", isAction: true },
        ]}
      />
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Could not load orders"
        description="Please try again in a moment."
        action={
          <Button type="button" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const total = data?.pagination.total ?? 0;
  const hasFilters = statusFilter !== "all" || paymentFilter !== "all";
  const isEmptyCatalog = total === 0 && !hasSearch && !hasFilters;
  const showPagination = (data?.pagination.total ?? 0) > 0 || filtered.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="w-72">
          <Input
            value={searchInput}
            disabled={isEmptyCatalog}
            placeholder="Search orders"
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-32">
          <Select
            value={statusFilter}
            disabled={isEmptyCatalog}
            onValueChange={(value) => setStatusFilter(value ?? "all")}
          >
            <SelectTrigger className="w-full" disabled={isEmptyCatalog}>
              <SelectValue placeholder="Order status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <Select
            value={paymentFilter}
            disabled={isEmptyCatalog}
            onValueChange={(value) => setPaymentFilter(value ?? "all")}
          >
            <SelectTrigger className="w-full" disabled={isEmptyCatalog}>
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() =>
            qc.invalidateQueries({ queryKey: queryKeys.admin.orders() })
          }
        >
          Refresh
        </Button>
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="w-36 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-sm">
                    {o.orderNumber}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm tabular-nums">
                    {formatOrderDate(o.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    ${o.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Link
                      href={ROUTES.order(o.id)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "icon" })
                      )}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {showPagination ? (
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
