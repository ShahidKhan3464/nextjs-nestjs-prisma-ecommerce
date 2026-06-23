import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-lg font-medium">Page not found</p>
      <Link
        href={ROUTES.home}
        className="mt-4 inline-block text-sm underline underline-offset-4"
      >
        Go home
      </Link>
    </div>
  );
}
