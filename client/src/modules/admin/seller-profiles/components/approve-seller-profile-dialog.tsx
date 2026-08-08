"use client";

import { toast } from "sonner";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { SellerProfile } from "../types";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveAdminSellerProfile } from "../services/seller-profiles.service";
import { invalidateSellerProfileQueries } from "../utils/invalidate-seller-profile-queries";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
  approveSellerProfileSchema,
  type ApproveSellerProfileValues,
} from "../schemas";

type Props = {
  open: boolean;
  profile: SellerProfile | null;
  onOpenChange: (open: boolean) => void;
};

export function ApproveSellerProfileDialog({
  open,
  profile,
  onOpenChange,
}: Props) {
  const qc = useQueryClient();
  const form = useForm<ApproveSellerProfileValues>({
    resolver: zodResolver(approveSellerProfileSchema),
    defaultValues: {
      storeName: "",
      description: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
    },
  });

  useEffect(() => {
    if (open && profile) {
      form.reset({
        storeName: profile.businessName,
        description: "",
        address: "",
        city: "",
        postalCode: "",
        country: "",
      });
    }
  }, [open, profile, form]);

  const mutation = useMutation({
    mutationFn: (values: ApproveSellerProfileValues) => {
      if (!profile) throw new Error("Missing profile");
      const storeName = values.storeName?.trim();
      const description = values.description?.trim();
      return approveAdminSellerProfile(profile.id, {
        address: values.address.trim(),
        city: values.city.trim(),
        postalCode: values.postalCode.trim(),
        country: values.country.trim(),
        ...(storeName ? { storeName } : {}),
        ...(description ? { description } : {}),
      });
    },
    onSuccess: async (updated) => {
      toast.success("Seller application approved");
      onOpenChange(false);
      qc.setQueryData(
        queryKeys.admin.sellerProfile(String(updated.id)),
        updated
      );
      await invalidateSellerProfileQueries(qc, updated.id);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not approve seller")),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg data-[size=default]:sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Approve seller application?</AlertDialogTitle>
          <AlertDialogDescription>
            {profile
              ? `Approving "${profile.businessName}" creates their store and grants the SELLER role.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form
            id="approve-seller-form"
            className="space-y-3"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              name="storeName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store name (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={mutation.isPending}
                      placeholder="Defaults to business name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="address"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store address</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                name="city"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={mutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="postalCode"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal code</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={mutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              name="country"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      {...field}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="submit"
            form="approve-seller-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Approving…" : "Approve"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
