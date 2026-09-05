import type { Metadata } from "next";
import { AdminStoresList } from "@/modules/admin/stores";

export const metadata: Metadata = {
  title: "Stores",
};

export default function AdminStoresPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Stores
        </h1>
        <p className="text-muted-foreground text-sm">
          Verify, suspend, and manage marketplace storefronts.
        </p>
      </header>
      <AdminStoresList />
    </div>
  );
}
