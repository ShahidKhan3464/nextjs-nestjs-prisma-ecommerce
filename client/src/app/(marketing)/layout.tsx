import { SiteShell } from "@/shared/components/layout/site-shell";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
