"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Store, StoreModerationAction } from "../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateAdminStoreQueries } from "../utils/invalidate-store-queries";
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
  store: Store | null;
  action: StoreModerationAction;
  onOpenChange: (open: boolean) => void;
  mutationFn: (storeId: number) => Promise<Store>;
  successMessage: string;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
};

export function ConfirmStoreActionDialog({
  open,
  store,
  action,
  title,
  mutationFn,
  description,
  destructive,
  onOpenChange,
  confirmLabel,
  successMessage,
}: Props) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      if (!store) throw new Error("Missing store");
      return mutationFn(store.id);
    },
    onSuccess: async (updated) => {
      toast.success(successMessage);
      onOpenChange(false);
      await invalidateAdminStoreQueries(qc, updated.id);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, `Could not ${action} store`)),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            variant={destructive ? "destructive" : "default"}
          >
            {mutation.isPending ? "Working…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
