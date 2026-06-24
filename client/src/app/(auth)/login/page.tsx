import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";
import { LoginForm } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${siteConfig.name}`,
};

function LoginFallback() {
  return (
    <p className="text-muted-foreground text-center text-sm">Loading form…</p>
  );
}

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-sm">
          Sign in with the email and password you used when you registered.
        </p>
      </div>
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
      <p className="text-muted-foreground text-center text-sm">
        New here?{" "}
        <Link
          href={ROUTES.register}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
