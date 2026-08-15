"use client";

import { cn } from "@/lib/utils";
import { NotificationsList } from "./notifications-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  children: React.ReactNode;
  triggerClassName?: string;
  triggerLabel: string;
  className?: string;
};

export function NotificationsPopover({
  children,
  triggerClassName,
  triggerLabel,
  className,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={triggerLabel}
        className={triggerClassName}
      >
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className={cn(
          "w-[min(100vw-2rem,28rem)] max-h-[min(70vh,32rem)] overflow-y-auto p-0",
          className
        )}
      >
        <div className="border-border space-y-1 border-b px-4 py-3">
          <p className="font-heading text-sm font-semibold">Notifications</p>
          <p className="text-muted-foreground text-xs">
            Order updates, seller status, and marketplace announcements.
          </p>
        </div>
        <div className="p-4">
          <NotificationsList compact />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
