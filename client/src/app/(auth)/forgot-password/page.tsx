import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ForgotPasswordForm } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Forgot password",
  description: `Reset access — ${siteConfig.name}`,
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Reset password
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we will send reset instructions if we find an
          account.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
