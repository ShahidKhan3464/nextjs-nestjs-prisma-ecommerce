"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { ExternalLink, RefreshCw } from "lucide-react";
import { SuspendStoreDialog } from "./suspend-store-dialog";
import { AdminDetailSkeleton } from "@/modules/admin/shared";
import { isStoreVerified } from "@/modules/seller/store/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ConfirmStoreActionDialog } from "./confirm-store-action-dialog";
import {
  fetchAdminStore,
  verifyAdminStore,
  unverifyAdminStore,
  unsuspendAdminStore,
} from "../services/stores.service";

type Props = { storeId: string };

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return format(new Date(iso), "MMM d, yyyy · HH:mm");
}

function MetaCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 border-border rounded-lg border p-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

export function AdminStoreDetail({ storeId }: Props) {
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [unverifyOpen, setUnverifyOpen] = useState(false);
  const [unsuspendOpen, setUnsuspendOpen] = useState(false);

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.admin.stores.detail(storeId),
    queryFn: () => fetchAdminStore(storeId),
  });

  if (isPending) {
    return <AdminDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Store not found"
        description="This store may have been removed or the id is invalid."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
            <Link
              href={ROUTES.adminStores}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back to stores
            </Link>
          </div>
        }
      />
    );
  }

  const store = data;
  const verified = isStoreVerified(store);
  const isSuspended = store.status === "SUSPENDED";

  return (
    <div
      className={cn(
        "grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_500px]",
        isFetching ? "opacity-90" : undefined
      )}
    >
      <div className="space-y-6">
        <div className="min-w-0 space-y-2">
          <p className="text-muted-foreground text-sm">Store</p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            {store.name}
          </h2>
        </div>

        <section className="space-y-3 text-sm">
          <h3 className="font-medium tracking-wide uppercase">
            Store information
          </h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-mono text-xs">{store.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Address</dt>
              <dd>
                {store.address}
                <br />
                {store.city}, {store.postalCode}
                <br />
                {store.country}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Description</dt>
              <dd className="whitespace-pre-wrap">
                {store.description || "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3 text-sm">
          <h3 className="font-medium tracking-wide uppercase">
            Seller / business
          </h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-muted-foreground">Business name</dt>
              <dd className="font-medium">
                {store.sellerProfile.businessName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Seller profile</dt>
              <dd>
                <Link
                  href={ROUTES.sellerProfile(store.sellerProfileId)}
                  className="hover:underline"
                >
                  #{store.sellerProfileId} · {store.sellerProfile.status}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Seller user id</dt>
              <dd className="font-mono">
                <Link
                  href={ROUTES.user(String(store.sellerProfile.userId))}
                  className="hover:underline"
                >
                  {store.sellerProfile.userId}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Reviews</dt>
              <dd className="tabular-nums">{store.totalReviews ?? 0}</dd>
            </div>
          </dl>
        </section>

        <Link
          href={ROUTES.publicStore(store.slug)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ExternalLink className="size-3.5" />
          View public store
        </Link>
      </div>

      <aside className="bg-muted/40 border-border space-y-4 rounded-xl border p-4 lg:sticky lg:top-28">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isSuspended ? "destructive" : "default"}>
            {store.status}
          </Badge>
          <Badge variant="outline">
            {verified ? "Verified" : "Unverified"}
          </Badge>
          <Badge variant="outline" className="font-mono">
            #{store.id}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {!verified ? (
            <Button type="button" onClick={() => setVerifyOpen(true)}>
              Verify
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setUnverifyOpen(true)}
            >
              Unverify
            </Button>
          )}
          {isSuspended ? (
            <Button type="button" onClick={() => setUnsuspendOpen(true)}>
              Unsuspend
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setSuspendOpen(true)}
            >
              Suspend
            </Button>
          )}
        </div>

        <MetaCard label="Created">
          <p className="tabular-nums">{formatDateTime(store.createdAt)}</p>
        </MetaCard>
        <MetaCard label="Verified at">
          <p className="tabular-nums">{formatDateTime(store.verifiedAt)}</p>
        </MetaCard>
        <MetaCard label="Avg rating">
          <p className="tabular-nums">
            {store.averageRating != null ? store.averageRating.toFixed(1) : "—"}
          </p>
        </MetaCard>
        <MetaCard label="Products sold">
          <p className="tabular-nums">{store.productsSold ?? "—"}</p>
        </MetaCard>

        {store.suspensionReason ? (
          <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4 text-sm">
            <p className="font-medium">Suspension reason</p>
            <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
              {store.suspensionReason}
            </p>
            {store.suspendedAt ? (
              <p className="text-muted-foreground mt-2 text-xs tabular-nums">
                Suspended {formatDateTime(store.suspendedAt)}
              </p>
            ) : null}
          </div>
        ) : null}

        <Link
          href={ROUTES.adminStores}
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          All stores
        </Link>
      </aside>

      <SuspendStoreDialog
        store={store}
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
      />
      <ConfirmStoreActionDialog
        store={store}
        action="unsuspend"
        open={unsuspendOpen}
        title="Unsuspend store?"
        confirmLabel="Unsuspend"
        onOpenChange={setUnsuspendOpen}
        mutationFn={unsuspendAdminStore}
        successMessage="Store unsuspended"
        description={`Restore "${store.name}" to active status.`}
      />
      <ConfirmStoreActionDialog
        store={store}
        action="verify"
        open={verifyOpen}
        confirmLabel="Verify"
        title="Verify store?"
        onOpenChange={setVerifyOpen}
        mutationFn={verifyAdminStore}
        successMessage="Store verified"
        description={`Mark "${store.name}" as verified.`}
      />
      <ConfirmStoreActionDialog
        destructive
        store={store}
        action="unverify"
        open={unverifyOpen}
        confirmLabel="Unverify"
        title="Remove verification?"
        onOpenChange={setUnverifyOpen}
        mutationFn={unverifyAdminStore}
        successMessage="Store unverified"
        description={`Clear verification for "${store.name}".`}
      />
    </div>
  );
}
