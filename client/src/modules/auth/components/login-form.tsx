"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useSearchParams } from "next/navigation";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "../schemas";
import { ACCOUNT_BLOCKED_MESSAGE } from "@/lib/account-blocked";
import { safeProtectedRedirectPath } from "@/lib/auth-route-guards";
import { loginRequest } from "@/modules/auth/services/auth.service";
import { syncCartAndWishlistWithServer } from "@/lib/cart-wishlist-sync";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export function LoginForm() {
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    try {
      const data = await loginRequest(values.email, values.password);
      setSession(data.user, data.accessToken, data.expiresIn);
      await syncCartAndWishlistWithServer().catch(() => undefined);
      toast.success("Signed in");
      const next =
        safeProtectedRedirectPath(searchParams.get("next")) ?? ROUTES.dashboard;
      window.location.assign(next);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Invalid email or password"));
    }
  }

  const blocked = searchParams.get("blocked") === "1";

  return (
    <Form {...form}>
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {blocked ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {ACCOUNT_BLOCKED_MESSAGE}
          </p>
        ) : null}
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between text-sm">
          <Link
            href={ROUTES.forgotPassword}
            className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}
