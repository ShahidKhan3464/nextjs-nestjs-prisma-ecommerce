"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { SellerProfile } from "../types";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  sellerApplicationSchema,
  type SellerApplicationValues,
} from "../schemas";
import {
  createSellerProfile,
  updateSellerProfile,
} from "../services/seller-profile.service";

type Props = {
  mode: "create" | "update";
  profile?: SellerProfile | null;
};

function toFormValues(profile?: SellerProfile | null): SellerApplicationValues {
  return {
    businessName: profile?.businessName ?? "",
    businessEmail: profile?.businessEmail ?? "",
    businessPhone: profile?.businessPhone ?? "",
    taxNumber: profile?.taxNumber ?? "",
    registrationNumber: profile?.registrationNumber ?? "",
  };
}

function toPayload(values: SellerApplicationValues) {
  return {
    businessName: values.businessName.trim(),
    businessEmail: values.businessEmail.trim(),
    businessPhone: values.businessPhone.trim(),
    ...(values.taxNumber?.trim() ? { taxNumber: values.taxNumber.trim() } : {}),
    ...(values.registrationNumber?.trim()
      ? { registrationNumber: values.registrationNumber.trim() }
      : {}),
  };
}

export function SellerApplicationForm({ mode, profile }: Props) {
  const qc = useQueryClient();
  const form = useForm<SellerApplicationValues>({
    resolver: zodResolver(sellerApplicationSchema),
    defaultValues: toFormValues(profile),
  });

  const mutation = useMutation({
    mutationFn: async (values: SellerApplicationValues) => {
      const body = toPayload(values);
      return mode === "create"
        ? createSellerProfile(body)
        : updateSellerProfile(body);
    },
    onSuccess: (next) => {
      qc.setQueryData(queryKeys.sellerProfile.me, next);
      toast.success(
        mode === "create"
          ? "Application submitted for review"
          : "Application updated"
      );
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          mode === "create"
            ? "Could not submit application"
            : "Could not update application"
        )
      );
    },
  });

  return (
    <Form {...form}>
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="businessName"
            control={form.control}
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Business name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="organization"
                    placeholder="Acme Trading LLC"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="businessEmail"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="seller@acme.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="businessPhone"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business phone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1234567890"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="taxNumber"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax number (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="TAX-123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="registrationNumber"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration number (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="REG-987654" {...field} />
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  Company registration or trade license ID.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? mode === "create"
              ? "Submitting…"
              : "Saving…"
            : mode === "create"
              ? "Submit application"
              : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}
