import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { CheckoutWizard } from "@/modules/customer/checkout";

export const metadata: Metadata = {
  title: "Checkout",
  description: `Checkout — ${siteConfig.name}`,
};

export default function CheckoutPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Checkout
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter shipping details, pay securely with your card, then review
          before you place your order.
        </p>
      </header>
      <CheckoutWizard />
    </div>
  );
}
