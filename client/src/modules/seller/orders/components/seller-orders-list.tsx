"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { EyeIcon } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/constants/query-keys";
import { formatOrderDate } from "@/lib/format-date";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { AdminTableSkeleton } from "@/modules/admin/shared";
import { fetchSellerOrders } from "../services/orders.service";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button, buttonVariants } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/modules/customer/orders/components/order-status-badges";
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
  { value: "pending", label: "Pending" },
] as const;

export function SellerOrdersList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(searchInput, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, paymentFilter]);

  const listParams = useMemo(() => {
    const params: {
      status?: string;
      paymentStatus?: string;
    } = {};
    if (statusFilter !== "all") params.status = statusFilter;
    if (paymentFilter !== "all") params.paymentStatus = paymentFilter;
    return Object.keys(params).length > 0 ? params : undefined;
  }, [statusFilter, paymentFilter]);

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.seller.orders.list(listParams ?? {}),
    queryFn: () => fetchSellerOrders(listParams),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return data;
    return data.filter((o) => {
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
  }, [data, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageClamped = Math.min(page, totalPages);
  const sliceStart = (pageClamped - 1) * perPage;
  const pageRows = filtered.slice(sliceStart, sliceStart + perPage);

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

  const total = data?.length ?? 0;
  const hasSearch = debouncedSearch.trim().length > 0;
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
              {ORDER_STATUS_OPTIONS.map((option) => (
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
              {PAYMENT_STATUS_OPTIONS.map((option) => (
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
        <div className="overflow-x-auto rounded-md border">
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
        </div>

        {filtered.length > 0 ? (
          <Pagination
            perPage={perPage}
            page={pageClamped}
            onPageChange={setPage}
            totalPages={totalPages}
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
