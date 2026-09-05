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
import { AdminTableSkeleton } from "@/modules/admin/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAdminPayments } from "../services/payments.service";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import {
  PAYMENT_STATUS_FILTER_OPTIONS,
  PAYMENT_PROVIDER_FILTER_OPTIONS,
} from "../constants";
import type {
  PaymentStatus,
  PaymentProvider,
  PaymentStatusFilter,
  PaymentProviderFilter,
} from "../types";
import {
  PaymentStatusBadge,
  formatPaymentAmount,
  PaymentProviderBadge,
} from "./payment-badges";
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

export function AdminPaymentsList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("ALL");
  const [providerFilter, setProviderFilter] =
    useState<PaymentProviderFilter>("ALL");

  useEffect(() => {
    setPage(1);
  }, [orderIdInput, statusFilter, providerFilter, perPage]);

  const { data, isPending, isFetching, isPlaceholderData, isError, refetch } =
    useQuery({
      queryKey: queryKeys.admin.payments.list({
        page,
        perPage,
        orderId: orderIdInput,
        status: statusFilter,
        provider: providerFilter,
      }),
      queryFn: () =>
        fetchAdminPayments({
          page,
          limit: perPage,
          orderId: orderIdInput.trim() || undefined,
          status:
            statusFilter === "ALL"
              ? undefined
              : (statusFilter as PaymentStatus),
          provider:
            providerFilter === "ALL"
              ? undefined
              : (providerFilter as PaymentProvider),
        }),
      placeholderData: (prev) => prev,
    });

  if (isPending && !data) {
    return (
      <AdminTableSkeleton
        filterWidths={["w-40", "w-40", "w-40", "w-24"]}
        columns={[
          { className: "w-24" },
          { className: "w-28" },
          { className: "w-24" },
          { className: "w-28" },
          { className: "flex-1" },
          { className: "w-24" },
          { className: "w-24" },
          { className: "w-28" },
          { className: "w-24 shrink-0", isAction: true },
        ]}
      />
    );
  }

  if (isError && !data) {
    return (
      <EmptyState
        title="Could not load payments"
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
  const hasFilters =
    orderIdInput.trim().length > 0 ||
    statusFilter !== "ALL" ||
    providerFilter !== "ALL";
  const isEmptyCatalog = total === 0 && !hasFilters;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="w-40">
          <Input
            value={orderIdInput}
            placeholder="Order id"
            disabled={isEmptyCatalog}
            onChange={(e) => setOrderIdInput(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            value={statusFilter}
            disabled={isEmptyCatalog && statusFilter === "ALL"}
            onValueChange={(value) =>
              setStatusFilter((value ?? "ALL") as PaymentStatusFilter)
            }
          >
            <SelectTrigger className="w-full!">
              <SelectValue placeholder="Status">
                {
                  PAYMENT_STATUS_FILTER_OPTIONS.find(
                    (opt) => opt.value === statusFilter
                  )?.label
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUS_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Select
            value={providerFilter}
            disabled={isEmptyCatalog && providerFilter === "ALL"}
            onValueChange={(value) =>
              setProviderFilter((value ?? "ALL") as PaymentProviderFilter)
            }
          >
            <SelectTrigger className="w-full!">
              <SelectValue placeholder="Method">
                {
                  PAYMENT_PROVIDER_FILTER_OPTIONS.find(
                    (opt) => opt.value === providerFilter
                  )?.label
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_PROVIDER_FILTER_OPTIONS.map((opt) => (
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
            qc.invalidateQueries({ queryKey: queryKeys.admin.payments.all })
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
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  {hasFilters
                    ? "No payments match your filters."
                    : "No payments yet."}
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-sm">
                    #{payment.id}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentProviderBadge provider={payment.provider} />
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatPaymentAmount(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={ROUTES.order(payment.orderId)}
                      className="text-sm hover:underline"
                    >
                      {payment.order?.orderNumber ?? `#${payment.orderId}`}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {payment.order?.userId ? (
                      <Link
                        href={ROUTES.user(payment.order.userId)}
                        className="hover:underline"
                      >
                        #{payment.order.userId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {payment.order?.storeId ? (
                      <Link
                        href={ROUTES.adminStore(payment.order.storeId)}
                        className="hover:underline"
                      >
                        #{payment.order.storeId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm tabular-nums">
                    {format(new Date(payment.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Link
                        href={ROUTES.payment(payment.id)}
                        aria-label={`View payment ${payment.id}`}
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
