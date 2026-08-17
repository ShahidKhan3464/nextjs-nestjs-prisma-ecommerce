import type { ProductStatus, SellerProduct } from "../types";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

const statusVariant: Record<ProductStatus, BadgeVariant> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  ARCHIVED: "outline",
};

const statusLabel: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Published",
  ARCHIVED: "Archived",
};

export function ProductStatusBadge({
  product,
}: {
  product: Pick<SellerProduct, "status" | "isRemoved">;
}) {
  if (product.isRemoved) {
    return <Badge variant="destructive">Removed</Badge>;
  }

  return (
    <Badge variant={statusVariant[product.status]}>
      {statusLabel[product.status]}
    </Badge>
  );
}
