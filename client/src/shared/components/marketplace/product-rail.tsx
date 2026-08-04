import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { RatingStars } from "./rating-stars";
import { EmptyState } from "@/shared/components/feedback/empty-state";

export type ProductRailItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image?: string | null;
  averageRating?: number | null;
};

type Props = {
  title: string;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  products: ProductRailItem[];
};

function formatPrice(amount: number) {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function ProductRail({
  title,
  products,
  emptyTitle = "No products yet",
  emptyDescription = "Check back soon for new arrivals.",
  className,
}: Props) {
  if (products.length === 0) {
    return (
      <section className={cn("space-y-3", className)}>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </section>
    );
  }

  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <ul className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => {
          const showRating =
            typeof product.averageRating === "number" &&
            !Number.isNaN(product.averageRating) &&
            product.averageRating > 0;

          return (
            <li key={product.id} className="w-40 shrink-0 sm:w-44">
              <Link
                href={ROUTES.product(product.slug)}
                className="border-border bg-card group flex h-full flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`View ${product.name}`}
              >
                <span className="bg-muted/40 relative block aspect-square w-full overflow-hidden">
                  <Image
                    fill
                    alt=""
                    src={product.image ?? "/placeholder.svg"}
                    sizes="176px"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="flex flex-1 flex-col gap-1.5 p-3">
                  <span className="line-clamp-2 text-sm font-medium tracking-tight">
                    {product.name}
                  </span>
                  {showRating ? (
                    <RatingStars
                      readOnly
                      size="sm"
                      value={product.averageRating!}
                      ariaLabel={`${product.name} rated ${product.averageRating!.toFixed(1)} out of 5`}
                    />
                  ) : null}
                  <span className="mt-auto text-sm font-semibold tabular-nums">
                    {formatPrice(product.price)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
