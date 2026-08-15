import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatFilterLabel } from "@/lib/format-filter-label";
import { getProductBadges, type Product, type ProductBadgeKind } from "../types";

const BADGE_LABEL: Record<ProductBadgeKind, string> = {
  new: "New",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

const BADGE_VARIANT: Record<
  ProductBadgeKind,
  "default" | "secondary" | "outline" | "destructive"
> = {
  new: "default",
  low_stock: "secondary",
  out_of_stock: "destructive",
};

type Props = {
  product: Product;
  className?: string;
  includeCategory?: boolean;
};

export function ProductBadges({
  product,
  className,
  includeCategory = false,
}: Props) {
  const kinds = getProductBadges(product);

  if (!includeCategory && kinds.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {includeCategory && product.category ? (
        <Badge variant="secondary" className="font-normal">
          {formatFilterLabel(product.category)}
        </Badge>
      ) : null}
      {kinds.map((kind) => (
        <Badge
          key={kind}
          className="font-normal"
          variant={BADGE_VARIANT[kind]}
        >
          {BADGE_LABEL[kind]}
        </Badge>
      ))}
    </div>
  );
}
