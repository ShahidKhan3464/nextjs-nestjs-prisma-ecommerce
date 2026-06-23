import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { RegisterForm } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Create account",
  description: `Register at ${siteConfig.name}`,
};

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-muted-foreground text-sm">
          Save your details for faster checkout, order updates, and your
          wishlist.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
