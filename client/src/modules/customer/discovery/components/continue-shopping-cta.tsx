import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  storeSlug?: string | null;
  storeName?: string | null;
  className?: string;
  label?: string;
};

export function ContinueShoppingCta({
  storeSlug,
  storeName,
  className,
  label,
}: Props) {
  const href = storeSlug ? ROUTES.publicStore(storeSlug) : ROUTES.products;
  const text =
    label ??
    (storeName ? `Continue shopping at ${storeName}` : "Continue shopping");

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "inline-flex justify-center",
        className
      )}
    >
      {text}
    </Link>
  );
}
