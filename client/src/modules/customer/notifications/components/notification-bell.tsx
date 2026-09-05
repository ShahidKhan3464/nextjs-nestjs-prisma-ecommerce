"use client";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { queryKeys } from "@/constants/query-keys";
import { buttonVariants } from "@/components/ui/button";
import { NotificationsPopover } from "./notifications-popover";
import { fetchUnreadNotificationCount } from "../services/notifications.service";

type Props = {
  className?: string;
};

export function NotificationBell({ className }: Props) {
  const user = useAuthStore((s) => s.user);
  const previousCount = useRef<number | null>(null);

  const { data: count = 0 } = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: fetchUnreadNotificationCount,
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchInterval: 120_000,
  });

  useEffect(() => {
    if (previousCount.current === null) {
      previousCount.current = count;
      return;
    }
    if (count > previousCount.current) {
      toast.info("You have new notifications");
    }
    previousCount.current = count;
  }, [count]);

  if (!user) return null;

  return (
    <NotificationsPopover
      triggerLabel={
        count > 0 ? `Notifications, ${count} unread` : "Notifications"
      }
      triggerClassName={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "relative",
        className
      )}
    >
      <Bell className="size-4" />
      {count > 0 ? (
        <span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </NotificationsPopover>
  );
}
