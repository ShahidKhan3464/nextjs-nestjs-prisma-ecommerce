import type { Metadata } from "next";
import { AdminSellerProfilesList } from "@/modules/admin/seller-profiles";

export const metadata: Metadata = {
  title: "Seller applications",
};

export default function SellerProfilesPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Seller applications
        </h1>
        <p className="text-muted-foreground text-sm">
          Review pending seller applications and manage approved sellers.
        </p>
      </header>

      <AdminSellerProfilesList />
    </div>
  );
}
