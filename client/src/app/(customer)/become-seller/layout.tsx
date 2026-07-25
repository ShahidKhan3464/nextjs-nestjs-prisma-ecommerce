import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Become a seller",
  description: `Apply to sell on ${siteConfig.name}`,
};

export default function BecomeSellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
