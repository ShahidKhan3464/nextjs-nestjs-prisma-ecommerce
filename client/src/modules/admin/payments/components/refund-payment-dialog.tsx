"use client";

import { toast } from "sonner";
import { useEffect } from "react";
import type { Payment } from "../types";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatPaymentAmount } from "./payment-badges";
import { refundAdminPayment } from "../services/payments.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidatePaymentQueries } from "../utils/invalidate-payment-queries";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
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
  recordRefundSchema,
  type RecordRefundFormValues,
} from "../schemas";

type Props = {
  open: boolean;
  payment: Payment | null;
  onOpenChange: (open: boolean) => void;
};

export function RefundPaymentDialog({ open, payment, onOpenChange }: Props) {
  const qc = useQueryClient();
  const remaining = payment
    ? Math.max(0, payment.amount - payment.refundedAmount)
    : 0;

  const form = useForm<RecordRefundFormValues>({
    resolver: zodResolver(recordRefundSchema),
    defaultValues: { reason: "", amount: "", externalRefundId: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ reason: "", amount: "", externalRefundId: "" });
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: RecordRefundFormValues) => {
      if (!payment) throw new Error("Missing payment");
      const amountRaw = values.amount?.trim();
      return refundAdminPayment(payment.id, {
        reason: values.reason.trim(),
        ...(amountRaw ? { amount: Number(amountRaw) } : {}),
        ...(values.externalRefundId?.trim()
          ? { externalRefundId: values.externalRefundId.trim() }
          : {}),
      });
    },
    onSuccess: async (updated) => {
      toast.success("Refund recorded");
      onOpenChange(false);
      await invalidatePaymentQueries(qc, updated.id);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not record refund")),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Record refund?</AlertDialogTitle>
          <AlertDialogDescription>
            {payment
              ? `Records a refund against payment #${payment.id}. Remaining refundable: ${formatPaymentAmount(remaining, payment.currency)}. This does not call Stripe.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form
            id="refund-payment-form"
            className="space-y-3"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <FormField
              name="amount"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="decimal"
                      disabled={mutation.isPending}
                      placeholder={`Full remaining (${remaining.toFixed(2)})`}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave blank to refund the full remaining amount.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="reason"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      {...field}
                      disabled={mutation.isPending}
                      placeholder="Why is this payment being refunded?"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="externalRefundId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External refund id (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={mutation.isPending}
                      placeholder="Provider refund reference"
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
            form="refund-payment-form"
            disabled={mutation.isPending || remaining <= 0}
          >
            {mutation.isPending ? "Recording…" : "Record refund"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
