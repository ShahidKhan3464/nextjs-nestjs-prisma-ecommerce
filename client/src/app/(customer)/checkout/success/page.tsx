import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { CheckoutSuccessView } from "@/modules/customer/checkout";

export const metadata: Metadata = {
  title: "Order confirmed",
  description: `Your order is confirmed — ${siteConfig.name}`,
};

export default function CheckoutSuccessPage() {
  return <CheckoutSuccessView />;
}
