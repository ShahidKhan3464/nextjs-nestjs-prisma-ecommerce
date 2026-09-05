"use client";

import { toast } from "sonner";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { SellerProfile } from "../types";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { suspendAdminSellerProfile } from "../services/seller-profiles.service";
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
  suspendSellerProfileSchema,
  type SuspendSellerProfileValues,
} from "../schemas";

type Props = {
  open: boolean;
  profile: SellerProfile | null;
  onOpenChange: (open: boolean) => void;
};

export function SuspendSellerProfileDialog({
  open,
  profile,
  onOpenChange,
}: Props) {
  const qc = useQueryClient();
  const form = useForm<SuspendSellerProfileValues>({
    resolver: zodResolver(suspendSellerProfileSchema),
    defaultValues: { suspensionReason: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ suspensionReason: "" });
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: SuspendSellerProfileValues) => {
      if (!profile) throw new Error("Missing profile");
      const suspensionReason = values.suspensionReason?.trim();
      return suspendAdminSellerProfile(
        profile.id,
        suspensionReason ? { suspensionReason } : {}
      );
    },
    onSuccess: async (updated) => {
      toast.success("Seller suspended");
      onOpenChange(false);
      qc.setQueryData(
        queryKeys.admin.sellerProfile(String(updated.id)),
        updated
      );
      await invalidateSellerProfileQueries(qc, updated.id);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not suspend seller")),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Suspend seller?</AlertDialogTitle>
          <AlertDialogDescription>
            {profile
              ? `Suspending "${profile.businessName}" marks the profile (and store, if any) as suspended.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form
            id="suspend-seller-form"
            className="space-y-3"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              name="suspensionReason"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      {...field}
                      disabled={mutation.isPending}
                      placeholder="Internal note stored with the store…"
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
            variant="destructive"
            form="suspend-seller-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Suspending…" : "Suspend"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
