import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { StorePage } from "@/modules/seller/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store",
  description: `Manage your storefront — ${siteConfig.name}`,
};

export default function StoreRoutePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Store
        </h1>
        <p className="text-muted-foreground text-sm">
          View and update your storefront details, branding, and status.
        </p>
      </header>
      <StorePage />
    </div>
  );
}
