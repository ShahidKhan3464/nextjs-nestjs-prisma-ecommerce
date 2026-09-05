import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { CheckoutSuccessView } from "@/modules/buyer/checkout";

export const metadata: Metadata = {
  title: "Order confirmed",
  description: `Your order is confirmed — ${siteConfig.name}`,
};

export default function CheckoutSuccessPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-0.5 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Order confirmed
        </h1>
        <p className="text-muted-foreground text-sm">
          Your payment was received and your order is being processed.
        </p>
      </header>
      <CheckoutSuccessView />
    </div>
  );
}
