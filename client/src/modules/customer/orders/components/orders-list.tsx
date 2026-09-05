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
import { fetchOrders } from "../services/orders.service";
import { AdminTableSkeleton } from "@/modules/admin/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badges";
import {
  ORDER_STATUS_FILTER_OPTIONS,
  BUYER_PAYMENT_STATUS_FILTER_OPTIONS,
} from "../constants";
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

export function OrdersList() {
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

  const { data, isPending } = useQuery({
    queryKey: queryKeys.orders.list(listParams),
    queryFn: () => fetchOrders(listParams),
  });

  const filtered = useMemo(() => {
    const orders = data?.orders ?? [];
    if (!hasSearch) return orders;
    const q = debouncedSearch.trim().toLowerCase();
    return orders.filter((o) => {
      const idMatch =
        o.id.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q);
      const itemMatch = o.items.some(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.variantLabel.toLowerCase().includes(q)
      );
      return idMatch || itemMatch;
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
          { className: "w-36" },
          { className: "w-24" },
          { className: "w-24" },
          { className: "flex-1" },
          { className: "min-w-32 flex-1" },
          { className: "w-24 shrink-0" },
          { className: "w-36 shrink-0", isAction: true },
        ]}
      />
    );
  }

  if (
    (data?.pagination.total ?? 0) === 0 &&
    statusFilter === "all" &&
    paymentFilter === "all" &&
    !debouncedSearch.trim()
  ) {
    return (
      <EmptyState
        title="No orders yet"
        description="When you place an order, it will appear here."
        action={
          <Link href={ROUTES.products} className={cn(buttonVariants())}>
            Start shopping
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <div className="w-72">
          <Input
            value={searchInput}
            placeholder="Search orders"
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-32">
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
        <div className="w-32">
          <Select
            value={paymentFilter}
            onValueChange={(value) => setPaymentFilter(value ?? "all")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              {BUYER_PAYMENT_STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() =>
            qc.invalidateQueries({ queryKey: queryKeys.orders.list() })
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
              <TableHead>Store</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead className="min-w-32 whitespace-normal">
                Items
              </TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="w-36 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell className="min-w-36 whitespace-normal">
                    {order.store ? (
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{order.store.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {order.store.sellerName}
                          {order.store.verified ? " · Verified" : ""}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm tabular-nums">
                    {formatOrderDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-56 text-sm whitespace-normal">
                    {order.items.length} item
                    {order.items.length === 1 ? "" : "s"}
                    {order.items[0] ? ` · ${order.items[0].productName}` : ""}
                  </TableCell>
                  <TableCell className="text-left font-medium tabular-nums">
                    ${order.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Link
                      href={ROUTES.order(order.id)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "icon" })
                      )}
                      aria-label={`View order ${order.orderNumber}`}
                      onMouseEnter={() => {
                        void qc.prefetchQuery({
                          queryKey: queryKeys.orders.detail(order.id),
                          queryFn: () =>
                            import("../services/orders.service").then((m) =>
                              m.fetchOrder(order.id)
                            ),
                        });
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

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
      </div>
    </div>
  );
}
