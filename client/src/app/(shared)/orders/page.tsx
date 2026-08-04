import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { OrdersList } from "@/modules/customer/orders";
import { AdminOrdersList } from "@/modules/admin/orders";
import { SellerOrdersList } from "@/modules/seller/orders";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import { isSeller, isSuperAdmin } from "@/modules/auth/utils/roles";

export const metadata: Metadata = {
  title: "Orders",
  description: `Order history — ${siteConfig.name}`,
};

export default async function OrdersPage() {
  const session = await getAccessTokenPayload();

  if (session && isSuperAdmin(session.roles)) {
    return (
      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Orders
            </h1>
            <p className="text-muted-foreground text-sm">
              Every order placed through checkout, newest first—open one for
              full line items and totals.
            </p>
          </div>
        </header>
        <AdminOrdersList />
      </div>
    );
  }

  if (session && isSeller(session.roles)) {
    return (
      <div className="space-y-4">
        <header className="space-y-0.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Orders
          </h1>
          <p className="text-muted-foreground text-sm">
            Orders placed against your store—fulfill, ship, and track revenue.
          </p>
        </header>
        <SellerOrdersList />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Orders
        </h1>
        <p className="text-muted-foreground text-sm">
          View status, totals, and receipts for everything you have ordered.
        </p>
      </header>
      <OrdersList />
    </div>
  );
}
