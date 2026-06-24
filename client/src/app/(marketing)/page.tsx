import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { Hero } from "@/shared/components/marketing/hero";

export const metadata: Metadata = {
  title: "Home",
  description: siteConfig.description,
};

export default function HomePage() {
  return <Hero />;
}
