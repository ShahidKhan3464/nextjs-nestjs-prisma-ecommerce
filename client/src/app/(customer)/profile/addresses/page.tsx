import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { AddressesManager } from "@/modules/buyer/addresses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Addresses",
  description: `Saved addresses — ${siteConfig.name}`,
};

export default function AddressesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Addresses
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage shipping and billing addresses for marketplace checkout.
        </p>
      </header>
      <AddressesManager />
    </div>
  );
}
