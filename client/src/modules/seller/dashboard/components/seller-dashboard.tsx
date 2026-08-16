"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { formatOrderDate } from "@/lib/format-date";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { fetchSellerDashboard } from "../services/dashboard.service";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { RatingStars } from "@/shared/components/marketplace/rating-stars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  normalizeOrderStatus,
  orderStatusChartColor,
} from "@/modules/buyer/orders/components/order-status-badges";
import {
  Area,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  AreaChart,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";

function formatStatusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatActivityTime(iso: string) {
  return format(new Date(iso), "MMM d, HH:mm");
}

export function SellerDashboard() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.dashboard.seller,
    queryFn: fetchSellerDashboard,
    staleTime: 30_000,
  });

  if (isError && !data) {
    return (
      <EmptyState
        title="Could not load seller dashboard"
        description={getApiErrorMessage(error, "Please try again.")}
        action={
          <Button
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Retrying…" : "Retry"}
          </Button>
        }
      />
    );
  }

  const ordersByStatus =
    data?.ordersByStatus.map((row) => ({
      ...row,
      label: formatStatusLabel(row.status),
    })) ?? [];

  const store = data?.store;

  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Store performance, inventory alerts, and recent activity.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {isPending ? (
              <>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64 max-w-full" />
                <Skeleton className="h-4 w-full max-w-2xl" />
              </>
            ) : store ? (
              <>
                <CardTitle className="font-heading text-xl">{store.name}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {store.businessName}
                  {store.city ? ` · ${store.city}` : ""}
                  {store.country ? `, ${store.country}` : ""}
                </p>
                {store.description ? (
                  <p className="text-muted-foreground line-clamp-2 max-w-2xl text-sm">
                    {store.description}
                  </p>
                ) : null}
              </>
            ) : null}
            <Link
              href={ROUTES.store}
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "h-auto px-0"
              )}
            >
              Manage store
            </Link>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {isPending ? (
              <>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-28" />
              </>
            ) : store ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{formatStatusLabel(store.status)}</Badge>
                  {store.verifiedAt ? (
                    <Badge variant="outline">Verified</Badge>
                  ) : (
                    <Badge variant="outline">Unverified</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RatingStars
                    readOnly
                    size="md"
                    value={store.averageRating ?? 0}
                  />
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {(store.averageRating ?? 0).toFixed(1)} (
                    {store.totalReviews ?? 0})
                  </span>
                </div>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {store.productsSold ?? 0} products sold
                </p>
              </>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(
          [
            ["Revenue", `$${data?.totals.revenue.toFixed(2) ?? "0.00"}`],
            ["Orders", data?.totals.orders ?? 0],
            ["Pending orders", data?.totals.pendingOrders ?? 0],
            ["Products", data?.totals.products ?? 0],
            ["Variants", data?.totals.variants ?? 0],
            ["Low stock", data?.totals.lowStockCount ?? 0],
          ] as const
        ).map(([title, value]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-semibold tabular-nums">{value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue (7 days)</CardTitle>
          </CardHeader>
          <CardContent className={cn("h-72", !isPending && "pl-0")}>
            {isPending ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueByDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8 }}
                  formatter={(value) => [
                    typeof value === "number"
                      ? `$${value.toFixed(2)}`
                      : String(value ?? ""),
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent
            className={cn(
              isPending || ordersByStatus.length > 0 ? "h-72" : undefined,
              !isPending && ordersByStatus.length > 0 && "pl-0"
            )}
          >
            {isPending ? (
              <Skeleton className="h-full w-full" />
            ) : ordersByStatus.length === 0 ? (
              <EmptyState
                title="No orders yet"
                description="Order status breakdown will appear after your first sale."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ordersByStatus.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={
                          orderStatusChartColor[
                            normalizeOrderStatus(entry.status)
                          ]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent orders</CardTitle>
          <Link
            href={ROUTES.orders}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <Skeleton className="h-40 w-full" />
          ) : (data?.recentOrders.length ?? 0) === 0 ? (
            <EmptyState
              title="No orders yet"
              description="Orders for your store will appear here once customers check out."
              action={
                <Link
                  href={ROUTES.products}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Manage products
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={ROUTES.order(order.id)}
                          className="font-medium hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatOrderDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${order.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : (data?.lowStock.length ?? 0) === 0 ? (
              <EmptyState
                title="Inventory looks healthy"
                description="No variants are below the low-stock threshold."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.lowStock.map((row) => (
                      <TableRow key={row.sku}>
                        <TableCell className="font-mono text-xs">
                          {row.sku}
                        </TableCell>
                        <TableCell>{row.product}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.stock}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : (data?.recentActivity.length ?? 0) === 0 ? (
              <EmptyState
                title="No recent activity"
                description="Order and product updates will show up here."
              />
            ) : (
              <ul className="divide-y">
                {data?.recentActivity.map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      "flex flex-col gap-1 py-3 first:pt-0 last:pb-0",
                      !item.isRead && "bg-muted/40 -mx-2 rounded-md px-2"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-snug">
                        {item.title}
                      </p>
                      <time className="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {formatActivityTime(item.createdAt)}
                      </time>
                    </div>
                    <p className="text-muted-foreground text-sm leading-snug">
                      {item.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : (data?.recentReviews?.length ?? 0) === 0 ? (
              <EmptyState
                title="No reviews yet"
                description="Customer reviews for your products will appear here."
              />
            ) : (
              <ul className="divide-y">
                {data?.recentReviews?.map((review) => (
                  <li key={review.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={ROUTES.product(review.productSlug)}
                        className="text-sm font-medium hover:underline"
                      >
                        {review.productName}
                      </Link>
                      <RatingStars readOnly value={review.rating} size="sm" />
                    </div>
                    {review.comment ? (
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {review.comment}
                      </p>
                    ) : null}
                    <p className="text-muted-foreground text-xs">
                      {review.buyerName} · {formatOrderDate(review.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : (data?.topProducts?.length ?? 0) === 0 ? (
              <EmptyState
                title="No sales data yet"
                description="Best-selling products will show up after orders come in."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.topProducts?.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>
                          <Link
                            href={ROUTES.product(product.slug)}
                            className="font-medium hover:underline"
                          >
                            {product.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {product.unitsSold}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ${product.revenue.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <RatingStars
                              readOnly
                              value={product.averageRating}
                              size="sm"
                            />
                            <span className="text-muted-foreground text-xs tabular-nums">
                              ({product.reviewCount})
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
