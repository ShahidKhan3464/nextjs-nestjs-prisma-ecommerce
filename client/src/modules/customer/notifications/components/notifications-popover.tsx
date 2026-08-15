"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu
      open={open}
      modal={false}
      onOpenChange={(next, eventDetails) => {
        if (next) {
          setOpen(true);
          return;
        }
        if (
          eventDetails.reason === "outside-press" ||
          eventDetails.reason === "focus-out"
        ) {
          return;
        }
        setOpen(false);
      }}
    >
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
          "flex h-[min(60vh,720px)]! max-h-[min(60vh,720px)]! w-[min(100vw-2rem,42rem)]! min-w-[min(100vw-2rem,42rem)] flex-col overflow-hidden p-0",
          className
        )}
      >
        <div className="border-border flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3">
          <div className="space-y-1">
            <p className="font-heading text-sm font-semibold">Notifications</p>
            <p className="text-muted-foreground text-xs">
              Order updates, seller status, and marketplace announcements.
            </p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="shrink-0"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <NotificationsList compact />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
