"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordRequest } from "@/modules/auth/services/auth.service";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      await forgotPasswordRequest(values.email);
      toast.success(
        "If an account exists, you will receive reset instructions."
      );
      form.reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Something went wrong"));
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
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
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </Form>
  );
}
