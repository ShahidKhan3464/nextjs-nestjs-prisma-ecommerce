"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Payment } from "@/modules/admin/payments/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmSellerCodPayment } from "../services/payments.service";
import { formatPaymentAmount } from "@/modules/admin/payments/components/payment-badges";
import { invalidatePaymentQueries } from "@/modules/admin/payments/utils/invalidate-payment-queries";
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
  payment: Payment | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (payment: Payment) => void;
};

export function ConfirmCodDialog({
  open,
  payment,
  onOpenChange,
  onSuccess,
}: Props) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      if (!payment) throw new Error("Missing payment");
      return confirmSellerCodPayment(payment.id);
    },
    onSuccess: async (updated) => {
      toast.success("COD payment confirmed");
      onOpenChange(false);
      onSuccess?.(updated);
      await invalidatePaymentQueries(qc, updated.id);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not confirm COD")),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm cash on delivery?</AlertDialogTitle>
          <AlertDialogDescription>
            {payment
              ? `Mark payment #${payment.id} (${formatPaymentAmount(payment.amount, payment.currency)}) as collected. This updates the order payment status.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Confirming…" : "Confirm COD"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
