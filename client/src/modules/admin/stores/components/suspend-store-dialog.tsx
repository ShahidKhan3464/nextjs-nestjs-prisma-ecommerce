"use client";

import { toast } from "sonner";
import { useEffect } from "react";
import type { Store } from "../types";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { suspendAdminStore } from "../services/stores.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateAdminStoreQueries } from "../utils/invalidate-store-queries";
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
import { suspendStoreSchema, type SuspendStoreFormValues } from "../schemas";

type Props = {
  open: boolean;
  store: Store | null;
  onOpenChange: (open: boolean) => void;
};

export function SuspendStoreDialog({ open, store, onOpenChange }: Props) {
  const qc = useQueryClient();
  const form = useForm<SuspendStoreFormValues>({
    resolver: zodResolver(suspendStoreSchema),
    defaultValues: { suspensionReason: "" },
  });

  useEffect(() => {
    if (open) form.reset({ suspensionReason: "" });
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: SuspendStoreFormValues) => {
      if (!store) throw new Error("Missing store");
      const suspensionReason = values.suspensionReason?.trim();
      return suspendAdminStore(
        store.id,
        suspensionReason ? { suspensionReason } : {}
      );
    },
    onSuccess: async (updated) => {
      toast.success("Store suspended");
      onOpenChange(false);
      await invalidateAdminStoreQueries(qc, updated.id);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not suspend store")),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Suspend store?</AlertDialogTitle>
          <AlertDialogDescription>
            {store
              ? `Suspending "${store.name}" blocks storefront activity until unsuspended.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form
            id="suspend-store-form"
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
                      placeholder="Policy violation note…"
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
            form="suspend-store-form"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Suspending…" : "Suspend"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
