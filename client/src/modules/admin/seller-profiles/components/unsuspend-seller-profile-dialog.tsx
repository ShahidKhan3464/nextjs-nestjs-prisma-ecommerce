"use client";

import { toast } from "sonner";
import type { SellerProfile } from "../types";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unsuspendAdminSellerProfile } from "../services/seller-profiles.service";
import { invalidateSellerProfileQueries } from "../utils/invalidate-seller-profile-queries";
import { invalidateAdminStoreQueries } from "@/modules/admin/stores/utils/invalidate-store-queries";
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

export function UnsuspendSellerProfileDialog({
  open,
  profile,
  onOpenChange,
}: Props) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      if (!profile) throw new Error("Missing profile");
      return unsuspendAdminSellerProfile(profile.id);
    },
    onSuccess: async (updated) => {
      toast.success("Seller unsuspended");
      onOpenChange(false);
      qc.setQueryData(
        queryKeys.admin.sellerProfile(String(updated.id)),
        updated
      );
      await invalidateSellerProfileQueries(qc, updated.id);
      if (updated.store?.id) {
        await invalidateAdminStoreQueries(qc, updated.store.id);
      }
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not unsuspend seller")),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Unsuspend seller?</AlertDialogTitle>
          <AlertDialogDescription>
            {profile
              ? `Restoring "${profile.businessName}" returns the profile (and store, if any) to its prior status.`
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
            {mutation.isPending ? "Unsuspending…" : "Unsuspend"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
