import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { AdminReviewsList } from "@/modules/admin/reviews";
import { SellerReviewsList } from "@/modules/seller/reviews";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import { isSeller, isSuperAdmin } from "@/modules/auth/utils/roles";

export const metadata: Metadata = {
  title: "Reviews",
  description: `Product reviews — ${siteConfig.name}`,
};

export default async function ReviewsPage() {
  const session = await getAccessTokenPayload();

  if (session && isSuperAdmin(session.roles)) {
    return (
      <div className="space-y-4">
        <header className="space-y-0.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Reviews
          </h1>
          <p className="text-muted-foreground text-sm">
            Moderate marketplace product reviews across all stores.
          </p>
        </header>
        <AdminReviewsList />
      </div>
    );
  }

  if (session && isSeller(session.roles)) {
    return (
      <div className="space-y-4">
        <header className="space-y-0.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Reviews
          </h1>
          <p className="text-muted-foreground text-sm">
            Ratings and feedback left on products from your store.
          </p>
        </header>
        <SellerReviewsList />
      </div>
    );
  }

  redirect(ROUTES.dashboard);
}
