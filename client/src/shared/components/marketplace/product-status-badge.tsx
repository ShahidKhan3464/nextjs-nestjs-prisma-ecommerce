import { Badge } from "@/components/ui/badge";

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type MarketplaceProductStatus = (typeof PRODUCT_STATUSES)[number];

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const statusVariant: Record<MarketplaceProductStatus, BadgeVariant> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  ARCHIVED: "outline",
};

const statusLabel: Record<MarketplaceProductStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Published",
  ARCHIVED: "Archived",
};

type Props = {
  status: MarketplaceProductStatus | string;
  isRemoved?: boolean;
  className?: string;
};

function resolveStatus(status: string): MarketplaceProductStatus | null {
  return (PRODUCT_STATUSES as readonly string[]).includes(status)
    ? (status as MarketplaceProductStatus)
    : null;
}

export function ProductStatusBadge({
  status,
  isRemoved = false,
  className,
}: Props) {
  if (isRemoved) {
    return (
      <Badge variant="destructive" className={className}>
        Removed
      </Badge>
    );
  }

  const resolved = resolveStatus(status);
  if (!resolved) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge variant={statusVariant[resolved]} className={className}>
      {statusLabel[resolved]}
    </Badge>
  );
}
