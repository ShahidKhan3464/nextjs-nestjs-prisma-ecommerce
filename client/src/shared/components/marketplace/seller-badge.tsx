import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BriefcaseBusiness } from "lucide-react";

export const SELLER_STATUS_HINTS = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
] as const;

export type SellerStatusHint = (typeof SELLER_STATUS_HINTS)[number];

const STATUS_LABEL: Record<SellerStatusHint, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

const STATUS_VARIANT: Record<
  SellerStatusHint,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  SUSPENDED: "outline",
};

type Props = {
  businessName: string;
  status?: SellerStatusHint | string | null;
  className?: string;
  compact?: boolean;
};

function resolveStatus(status?: string | null): SellerStatusHint | null {
  if (!status) return null;
  return (SELLER_STATUS_HINTS as readonly string[]).includes(status)
    ? (status as SellerStatusHint)
    : null;
}

export function SellerBadge({
  businessName,
  status,
  className,
  compact = false,
}: Props) {
  const resolved = resolveStatus(status ?? null);

  return (
    <div
      className={cn(
        "inline-flex min-w-0 max-w-full flex-wrap items-center gap-2",
        className
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <BriefcaseBusiness
          aria-hidden
          className={cn(
            "text-muted-foreground shrink-0",
            compact ? "size-3" : "size-3.5"
          )}
        />
        <span
          className={cn(
            "min-w-0 truncate font-medium",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {businessName}
        </span>
      </span>
      {resolved ? (
        <Badge
          variant={STATUS_VARIANT[resolved]}
          className={cn(compact && "px-1.5 py-0 text-[10px]")}
        >
          {STATUS_LABEL[resolved]}
        </Badge>
      ) : null}
    </div>
  );
}
