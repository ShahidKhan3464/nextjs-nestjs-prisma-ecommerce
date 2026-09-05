"use client";

import { toast } from "sonner";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Payment } from "@/modules/admin/payments/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rejectSellerCodPayment } from "../services/payments.service";
import { formatPaymentAmount } from "@/modules/admin/payments/components/payment-badges";
import { invalidatePaymentQueries } from "@/modules/admin/payments/utils/invalidate-payment-queries";
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
  rejectCodSchema,
  type RejectCodFormValues,
} from "@/modules/admin/payments/schemas";

type Props = {
  open: boolean;
  payment: Payment | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (payment: Payment) => void;
};

export function RejectCodDialog({
  open,
  payment,
  onOpenChange,
  onSuccess,
}: Props) {
  const qc = useQueryClient();
  const form = useForm<RejectCodFormValues>({
    resolver: zodResolver(rejectCodSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (open) form.reset({ reason: "" });
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: RejectCodFormValues) => {
      if (!payment) throw new Error("Missing payment");
      const reason = values.reason?.trim();
      return rejectSellerCodPayment(payment.id, reason ? { reason } : {});
    },
    onSuccess: async (updated) => {
      toast.success("COD payment rejected");
      onOpenChange(false);
      onSuccess?.(updated);
      await invalidatePaymentQueries(qc, updated.id);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not reject COD")),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Reject cash on delivery?</AlertDialogTitle>
          <AlertDialogDescription>
            {payment
              ? `Reject payment #${payment.id} (${formatPaymentAmount(payment.amount, payment.currency)}). The order payment will be marked failed/cancelled per backend rules.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form
            id="reject-cod-form"
            className="space-y-3"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              name="reason"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      {...field}
                      disabled={mutation.isPending}
                      placeholder="Customer unavailable, refused delivery…"
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
            form="reject-cod-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Rejecting…" : "Reject COD"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
