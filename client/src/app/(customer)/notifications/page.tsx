import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { NotificationsList } from "@/modules/customer/notifications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications",
  description: `Your notifications — ${siteConfig.name}`,
};

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Notifications
        </h1>
        <p className="text-muted-foreground text-sm">
          Order updates, seller status, and marketplace announcements.
        </p>
      </header>
      <NotificationsList />
    </div>
  );
}
