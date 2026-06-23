import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";
import { ResetPasswordForm } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Reset password",
  description: `Choose a new password — ${siteConfig.name}`,
};

function ResetPasswordFallback() {
  return (
    <p className="text-muted-foreground text-center text-sm">Loading form…</p>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter a new password for your account. After saving, sign in with the
          new password.
        </p>
      </div>
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
      <p className="text-muted-foreground text-center text-sm">
        <Link
          href={ROUTES.login}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
