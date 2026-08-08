import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import { AdminPaymentsList } from "@/modules/admin/payments";
import { SellerPaymentsList } from "@/modules/seller/payments";
import { isSeller, isSuperAdmin } from "@/modules/auth/utils/roles";

export const metadata: Metadata = {
  title: "Payments",
  description: `Payments — ${siteConfig.name}`,
};

export default async function PaymentsPage() {
  const session = await getAccessTokenPayload();

  if (session && isSuperAdmin(session.roles)) {
    return (
      <div className="space-y-4">
        <header className="space-y-0.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Payments
          </h1>
          <p className="text-muted-foreground text-sm">
            Inspect marketplace payments and record refunds.
          </p>
        </header>
        <AdminPaymentsList />
      </div>
    );
  }

  if (session && isSeller(session.roles)) {
    return (
      <div className="space-y-4">
        <header className="space-y-0.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Payments
          </h1>
          <p className="text-muted-foreground text-sm">
            Payments for orders placed against your store—confirm COD when
            collected.
          </p>
        </header>
        <SellerPaymentsList />
      </div>
    );
  }

  redirect(ROUTES.dashboard);
}
