import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { CheckoutWizard } from "@/modules/buyer/checkout";

export const metadata: Metadata = {
  title: "Checkout",
  description: `Secure multi-vendor checkout — ${siteConfig.name}`,
};

export default function CheckoutPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Checkout
        </h1>
        <p className="text-muted-foreground text-sm">
          Choose a shipping address, pay securely, then review your order. Items
          from different stores become separate orders after payment.
        </p>
      </header>
      <CheckoutWizard />
    </div>
  );
}
