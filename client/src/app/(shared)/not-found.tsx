import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-lg font-medium">Page not found</p>
      <Link
        href={ROUTES.dashboard}
        className={cn(buttonVariants(), "mt-8 inline-flex justify-center")}
      >
        Go to dashboard
      </Link>
    </div>
  );
}
