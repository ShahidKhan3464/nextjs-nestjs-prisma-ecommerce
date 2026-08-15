import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatOrderDate } from "@/lib/format-date";
import {
  Bell,
  CheckCircle,
  Package,
  PackageCheck,
  Shield,
  ShieldAlert,
  Store,
  Truck,
  XCircle,
} from "lucide-react";

export const NOTIFICATION_TYPE_ICONS = {
  ORDER_CREATED: Package,
  ORDER_SHIPPED: Truck,
  ORDER_DELIVERED: CheckCircle,
  ORDER_CANCELLED: XCircle,
  SELLER_APPROVED: Shield,
  SELLER_REJECTED: ShieldAlert,
  PRODUCT_APPROVED: PackageCheck,
  PRODUCT_REJECTED: XCircle,
  STORE_ANNOUNCEMENT: Store,
  PRODUCT_BACK_IN_STOCK: Package,
  SYSTEM: Bell,
} as const satisfies Record<string, LucideIcon>;

export type MarketplaceNotificationType = keyof typeof NOTIFICATION_TYPE_ICONS;

export type NotificationCardProps = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  className?: string;
  markReadPending?: boolean;
  onMarkRead?: (id: string) => void;
  type: MarketplaceNotificationType | string;
};

function resolveIcon(type: string): LucideIcon {
  if (type in NOTIFICATION_TYPE_ICONS) {
    return NOTIFICATION_TYPE_ICONS[type as MarketplaceNotificationType];
  }
  return Bell;
}

export function NotificationCard({
  id,
  type,
  title,
  isRead,
  message,
  createdAt,
  className,
  onMarkRead,
  markReadPending = false,
}: NotificationCardProps) {
  const Icon = resolveIcon(type);

  return (
    <article
      className={cn(
        "border-border flex gap-3 rounded-xl border p-2 transition-colors",
        !isRead && "bg-muted/40",
        className
      )}
    >
      <span
        className={cn(
          "bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg",
          !isRead && "bg-background text-foreground"
        )}
        aria-hidden
      >
        <Icon className="size-4.5" />
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{title}</h3>
              {!isRead ? <Badge variant="secondary">Unread</Badge> : null}
            </div>
            <p className="text-muted-foreground text-sm">{message}</p>
            <time
              dateTime={createdAt}
              className="text-muted-foreground block text-xs tabular-nums"
            >
              {formatOrderDate(createdAt)}
            </time>
          </div>

          {!isRead && onMarkRead ? (
            <Button
              size="sm"
              type="button"
              variant="ghost"
              disabled={markReadPending}
              onClick={() => onMarkRead(id)}
              aria-label={`Mark "${title}" as read`}
            >
              Mark read
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
