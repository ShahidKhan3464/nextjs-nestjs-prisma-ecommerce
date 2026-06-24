import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-lg font-medium">Page not found</p>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        That page may have moved or the link might be out of date. Try starting
        from the home page.
      </p>
      <Link
        href={ROUTES.home}
        className={cn(buttonVariants(), "mt-8 inline-flex justify-center")}
      >
        Go home
      </Link>
    </div>
  );
}
