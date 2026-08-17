"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { formatOrderDate } from "@/lib/format-date";
import { buttonVariants } from "@/components/ui/button";
import { isSuperAdmin } from "@/modules/auth/utils/roles";
import { AdminDetailSkeleton } from "@/modules/admin/shared";
import { fetchAdminUserDetail } from "../services/users.service";
import { EmptyState } from "@/shared/components/feedback/empty-state";

type Props = {
  userId: string;
};

function formatAddress(addr?: {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}) {
  if (!addr?.line1) return "—";
  return (
    <>
      {addr.fullName}
      <br />
      {addr.line1}
      {addr.line2 ? (
        <>
          <br />
          {addr.line2}
        </>
      ) : null}
      <br />
      {addr.city}, {addr.region} {addr.postalCode}
      <br />
      {addr.country}
    </>
  );
}

export function AdminUserDetail({ userId }: Props) {
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.admin.userDetail(userId),
    queryFn: () => fetchAdminUserDetail(userId),
  });

  if (isPending) {
    return <AdminDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Customer not found"
        description="This account may have been removed."
        action={
          <Link
            href={ROUTES.users}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to customers
          </Link>
        }
      />
    );
  }

  const { user } = data;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_500px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start gap-6">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-full border bg-muted">
            {data.profilePhotoUrl ? (
              <Image
                fill
                alt=""
                sizes="96px"
                className="object-cover"
                src={data.profilePhotoUrl}
              />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center text-2xl font-semibold">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-muted-foreground text-sm">Customer</p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              {user.fullName}
            </h2>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            {user.phoneNumber ? (
              <p className="text-muted-foreground text-sm">
                {user.phoneNumber}
              </p>
            ) : null}
          </div>
        </div>

        <section className="space-y-4">
          <h3 className="text-sm font-medium tracking-wide uppercase">
            Recent orders
          </h3>
          {data.recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders yet.</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {data.recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-muted-foreground">
                      {formatOrderDate(order.createdAt)} · {order.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium tabular-nums">
                      ${order.total.toFixed(2)}
                    </span>
                    <Link
                      href={ROUTES.order(order.id)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" })
                      )}
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2 text-sm">
            <h3 className="font-medium tracking-wide uppercase">
              Default address
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {formatAddress(data.defaultAddress)}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <h3 className="font-medium tracking-wide uppercase">
              Shipping addresses
            </h3>
            {data.shippingAddresses.length === 0 ? (
              <p className="text-muted-foreground">—</p>
            ) : (
              <ul className="text-muted-foreground space-y-3 leading-relaxed">
                {data.shippingAddresses.map((addr, i) => (
                  <li key={`ship-${i}`}>{formatAddress(addr)}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <h3 className="font-medium tracking-wide uppercase">
              Billing addresses
            </h3>
            {data.billingAddresses.length === 0 ? (
              <p className="text-muted-foreground">—</p>
            ) : (
              <ul className="text-muted-foreground space-y-3 leading-relaxed">
                {data.billingAddresses.map((addr, i) => (
                  <li key={`bill-${i}`}>{formatAddress(addr)}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <aside className="bg-muted/40 border-border space-y-4 rounded-xl border p-4 lg:sticky lg:top-28">
        <div className="flex flex-wrap gap-2">
          {user.isBlocked ? (
            <Badge variant="destructive">Blocked</Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300"
            >
              Active
            </Badge>
          )}
          {user.roles.map((role) => (
            <Badge
              key={role}
              variant={isSuperAdmin([role]) ? "default" : "outline"}
            >
              {role}
            </Badge>
          ))}
        </div>

        <div className="bg-background border-border rounded-lg border p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Customer ID
          </p>
          <p className="mt-1 font-mono text-sm">{user.id}</p>
        </div>
        <div className="bg-background border-border rounded-lg border p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Registered
          </p>
          <p className="mt-1 text-sm tabular-nums">
            {formatOrderDate(user.createdAt)}
          </p>
        </div>
        <div className="bg-background border-border rounded-lg border p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Total orders
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {data.totalOrders}
          </p>
        </div>
        <div className="bg-background border-border rounded-lg border p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Total spending
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            ${data.totalSpending.toFixed(2)}
          </p>
        </div>
        <div className="bg-background border-border rounded-lg border p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Wishlist items
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {data.wishlistCount}
          </p>
        </div>

        <Link
          href={ROUTES.users}
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          All customers
        </Link>
      </aside>
    </div>
  );
}
