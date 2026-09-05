"use client";

import Image from "next/image";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Ban, Copy } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  type Store,
  getStoreFile,
  isStoreVerified,
  isStoreSuspended,
} from "../types";

function formatStatusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return format(new Date(iso), "MMM d, yyyy");
}

type Props = {
  store: Store;
};

export function StoreView({ store }: Props) {
  const verified = isStoreVerified(store);
  const logo = getStoreFile(store, "LOGO");
  const suspended = isStoreSuspended(store);
  const banner = getStoreFile(store, "BANNER");
  const verifiedLabel = formatDate(store.verifiedAt);

  async function copySlug() {
    try {
      await navigator.clipboard.writeText(store.slug);
      toast.success("Slug copied");
    } catch {
      toast.error("Could not copy slug");
    }
  }

  return (
    <div className="space-y-6">
      {suspended ? (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive flex gap-3 rounded-lg border px-4 py-3"
        >
          <Ban className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="min-w-0 space-y-1">
            <p className="font-medium">Store suspended</p>
            <p className="text-sm opacity-90">
              {store.suspensionReason?.trim()
                ? store.suspensionReason
                : "This store cannot be edited or accept new listings until an admin unsuspends it."}
            </p>
            {store.suspendedAt ? (
              <p className="text-xs opacity-80">
                Suspended {formatDate(store.suspendedAt)}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="relative aspect-3/1 w-full overflow-hidden rounded-lg border bg-muted">
          {banner ? (
            <Image
              fill
              alt={`${store.name} banner`}
              src={banner.file.urlPath}
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          ) : (
            <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
              No banner uploaded
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
            {logo ? (
              <Image
                fill
                sizes="96px"
                src={logo.file.urlPath}
                className="object-cover"
                alt={`${store.name} logo`}
              />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center text-2xl font-semibold">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                {store.name}
              </h2>
              <Badge variant={suspended ? "destructive" : "secondary"}>
                {formatStatusLabel(store.status)}
              </Badge>
              {verified ? (
                <Badge variant="outline" className="gap-1">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline">Unverified</Badge>
              )}
            </div>

            <p className="text-muted-foreground text-sm">
              {store.sellerProfile.businessName}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-muted-foreground text-sm">
                Slug:{" "}
                <code className="bg-muted text-foreground rounded px-1.5 py-0.5 text-xs">
                  {store.slug}
                </code>
              </p>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                className="h-7 gap-1.5 px-2"
                onClick={() => void copySlug()}
              >
                <Copy className="size-3.5" aria-hidden />
                Copy
              </Button>
            </div>

            {verified && verifiedLabel ? (
              <p className="text-muted-foreground text-xs">
                Verified on {verifiedLabel}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="font-heading text-lg font-semibold">Store details</h3>
        {store.description ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {store.description}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">No description yet.</p>
        )}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Address</dt>
            <dd className="font-medium">{store.address}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">City</dt>
            <dd className="font-medium">{store.city}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Postal code</dt>
            <dd className="font-medium">{store.postalCode}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Country</dt>
            <dd className="font-medium">{store.country}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
