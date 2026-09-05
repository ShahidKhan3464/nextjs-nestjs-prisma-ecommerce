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
import { rejectAdminSellerProfile } from "../services/seller-profiles.service";
import { invalidateSellerProfileQueries } from "../utils/invalidate-seller-profile-queries";
import {
  rejectSellerProfileSchema,
  type RejectSellerProfileValues,
} from "../schemas";
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

type Props = {
  open: boolean;
  profile: SellerProfile | null;
  onOpenChange: (open: boolean) => void;
};

export function RejectSellerProfileDialog({
  open,
  profile,
  onOpenChange,
}: Props) {
  const qc = useQueryClient();
  const form = useForm<RejectSellerProfileValues>({
    resolver: zodResolver(rejectSellerProfileSchema),
    defaultValues: { rejectedReason: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ rejectedReason: "" });
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: RejectSellerProfileValues) => {
      if (!profile) throw new Error("Missing profile");
      return rejectAdminSellerProfile(profile.id, {
        rejectedReason: values.rejectedReason.trim(),
      });
    },
    onSuccess: async (updated) => {
      toast.success("Seller application rejected");
      onOpenChange(false);
      qc.setQueryData(
        queryKeys.admin.sellerProfile(String(updated.id)),
        updated
      );
      await invalidateSellerProfileQueries(qc, updated.id);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not reject seller")),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Reject seller application?</AlertDialogTitle>
          <AlertDialogDescription>
            {profile
              ? `Provide a clear reason for rejecting "${profile.businessName}". The applicant will be notified.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form
            id="reject-seller-form"
            className="space-y-3"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              name="rejectedReason"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rejection reason</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      {...field}
                      disabled={mutation.isPending}
                      placeholder="Explain what the applicant needs to fix…"
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
            form="reject-seller-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
