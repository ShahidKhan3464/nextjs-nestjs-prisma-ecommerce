import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  className?: string;
  label?: string;
};

export function ContinueShoppingCta({ className, label }: Props) {
  return (
    <Link
      href={ROUTES.products}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "inline-flex justify-center",
        className
      )}
    >
      {label ?? "Continue shopping"}
    </Link>
  );
}
