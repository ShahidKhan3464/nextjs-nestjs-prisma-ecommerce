import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <p className="text-center text-sm">
      Page not found. <Link href={ROUTES.login}>Back to sign in</Link>
    </p>
  );
}
