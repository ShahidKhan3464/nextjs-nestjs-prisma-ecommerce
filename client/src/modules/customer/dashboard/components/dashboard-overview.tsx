"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { queryKeys } from "@/constants/query-keys";
import { formatOrderDate } from "@/lib/format-date";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchCustomerDashboard } from "../services/dashboard.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  normalizeOrderStatus,
  orderStatusChartColor,
} from "@/modules/customer/orders/components/order-status-badges";
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
import {
  RecentlyViewedRail,
  RecommendedProductsRail,
} from "@/modules/customer/discovery";

function formatStatusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

export function DashboardOverview() {
  const user = useAuthStore((s) => s.user);
  const { data, isPending } = useQuery({
    queryKey: queryKeys.dashboard.customer,
    queryFn: fetchCustomerDashboard,
    staleTime: 30_000,
  });

  const ordersByStatus =
    data?.ordersByStatus.map((row) => ({
      ...row,
      label: formatStatusLabel(row.status),
    })) ?? [];

  const spendingByMonth =
    data?.spendingByMonth.map((row) => ({
      ...row,
      label: formatMonthLabel(row.month),
    })) ?? [];

  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Hello{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm">
          A quick snapshot of your spending, orders, and saved items.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total spend</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums">
                ${data?.totalSpending.toFixed(2) ?? "0.00"}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums">
                {data?.totalOrders ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums">
                {data?.wishlistCount ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cart items</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums">
                {data?.cartItemCount ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending (6 months)</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pl-0">
            {isPending ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8 }}
                    formatter={(value) => [
                      typeof value === "number"
                        ? `$${value.toFixed(2)}`
                        : String(value ?? ""),
                      "Spent",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
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
          <CardContent className="h-72 pl-0">
            {isPending ? (
              <Skeleton className="h-full w-full" />
            ) : ordersByStatus.length === 0 ? (
              <EmptyState
                title="No orders yet"
                description="Your order breakdown will show up here after your first purchase."
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
          <div className="flex gap-2">
            <Link
              href={ROUTES.orders}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <Skeleton className="h-40 w-full" />
          ) : !data?.recentOrders.length ? (
            <EmptyState
              title="No orders yet"
              description="Browse products and place your first order to see it here."
              action={
                <Link
                  href={ROUTES.products}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Shop products
                </Link>
              }
            />
          ) : (
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
                {data.recentOrders.map((order) => (
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
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent notifications</CardTitle>
            <Link
              href={ROUTES.notifications}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : !(data?.recentNotifications?.length ?? 0) ? (
              <EmptyState
                title="No notifications"
                description="Order and marketplace updates will show up here."
              />
            ) : (
              <ul className="divide-y">
                {data!.recentNotifications.slice(0, 5).map((item) => (
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
                        {formatOrderDate(item.createdAt)}
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

        <Card>
          <CardHeader>
            <CardTitle>Recently purchased</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : !(data?.recentlyPurchased?.length ?? 0) ? (
              <EmptyState
                title="No purchases yet"
                description="Products from your orders will appear here."
              />
            ) : (
              <ul className="flex flex-wrap gap-3">
                {data!.recentlyPurchased.slice(0, 8).map((item) => (
                  <li key={`${item.productId}-${item.purchasedAt}`}>
                    <Link
                      href={ROUTES.product(item.slug)}
                      className="group flex w-24 flex-col gap-2"
                    >
                      <div className="border-border relative size-20 overflow-hidden rounded-lg border bg-muted/40">
                        <Image
                          fill
                          alt=""
                          sizes="80px"
                          src={item.imageUrl ?? "/placeholder.svg"}
                          className="object-cover transition group-hover:scale-105"
                        />
                      </div>
                      <span className="line-clamp-2 text-xs font-medium">
                        {item.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-10">
        <RecentlyViewedRail />
        <RecommendedProductsRail />
      </div>
    </div>
  );
}
