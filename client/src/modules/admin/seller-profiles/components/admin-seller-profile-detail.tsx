"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { AdminDetailSkeleton } from "@/modules/admin/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Download, ExternalLink, RefreshCw } from "lucide-react";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { RejectSellerProfileDialog } from "./reject-seller-profile-dialog";
import { SuspendSellerProfileDialog } from "./suspend-seller-profile-dialog";
import { ApproveSellerProfileDialog } from "./approve-seller-profile-dialog";
import { fetchAdminSellerProfile } from "../services/seller-profiles.service";
import { SellerStatusBadge } from "@/modules/buyer/seller-registration/components/seller-status-badge";
import {
  DOCUMENT_TYPE_LABELS,
  sellerDocumentDownloadUrl,
} from "../constants";

type Props = {
  profileId: string;
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

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

export function AdminSellerProfileDetail({ profileId }: Props) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.admin.sellerProfile(profileId),
    queryFn: () => fetchAdminSellerProfile(profileId),
  });

  if (isPending) {
    return <AdminDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Seller application not found"
        description="This application may have been removed or the id is invalid."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
            <Link
              href={ROUTES.sellerProfiles}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back to applications
            </Link>
          </div>
        }
      />
    );
  }

  const profile = data;
  const canApprove = profile.status === "PENDING";
  const canReject = profile.status === "PENDING";
  const canSuspend =
    profile.status === "PENDING" || profile.status === "APPROVED";

  return (
    <div
      className={cn(
        "grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_500px]",
        isFetching ? "opacity-90" : undefined
      )}
    >
      <div className="space-y-6">
        <div className="min-w-0 space-y-2">
          <p className="text-muted-foreground text-sm">Seller application</p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            {profile.businessName}
          </h2>
        </div>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3 text-sm">
            <h3 className="font-medium tracking-wide uppercase">
              Business information
            </h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-muted-foreground">Business name</dt>
                <dd className="font-medium">{profile.businessName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tax number</dt>
                <dd>{profile.taxNumber || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Registration number</dt>
                <dd>{profile.registrationNumber || "—"}</dd>
              </div>
            </dl>
          </div>
          <div className="space-y-3 text-sm">
            <h3 className="font-medium tracking-wide uppercase">
              Contact information
            </h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-muted-foreground">Business email</dt>
                <dd>
                  <a
                    href={`mailto:${profile.businessEmail}`}
                    className="hover:underline"
                  >
                    {profile.businessEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Business phone</dt>
                <dd>{profile.businessPhone}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Applicant user id</dt>
                <dd className="font-mono">
                  <Link
                    href={ROUTES.user(String(profile.userId))}
                    className="hover:underline"
                  >
                    {profile.userId}
                  </Link>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-medium tracking-wide uppercase">
            Documents
          </h3>
          {profile.documents.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No documents uploaded.
            </p>
          ) : (
            <ul className="divide-border border-border divide-y rounded-lg border">
              {profile.documents.map((doc) => {
                const href = sellerDocumentDownloadUrl(doc.file.id);
                const previewHref = sellerDocumentDownloadUrl(doc.file.id, {
                  inline: true,
                });
                const isPdf =
                  doc.file.mimeType === "application/pdf" ||
                  doc.file.originalName.toLowerCase().endsWith(".pdf");
                const isImage = doc.file.mimeType.startsWith("image/");
                return (
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {doc.file.originalName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type} ·{" "}
                        {formatBytes(doc.file.fileSize)} · {doc.file.mimeType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPdf || isImage ? (
                        <a
                          href={previewHref}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" })
                          )}
                        >
                          <ExternalLink className="size-3.5" />
                          Preview
                        </a>
                      ) : null}
                      <a
                        href={href}
                        download={doc.file.originalName}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" })
                        )}
                      >
                        <Download className="size-3.5" />
                        Download
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {profile.store ? (
          <section className="space-y-4">
            <h3 className="text-sm font-medium tracking-wide uppercase">
              Store
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <MetaCard label="Name">
                <p className="font-medium">{profile.store.name}</p>
              </MetaCard>
              <MetaCard label="Status">
                <Badge
                  variant={
                    profile.store.status === "ACTIVE" ? "default" : "outline"
                  }
                >
                  {profile.store.status}
                </Badge>
              </MetaCard>
              <MetaCard label="Slug">
                <p className="font-mono text-xs">{profile.store.slug}</p>
              </MetaCard>
              <MetaCard label="Verified">
                <p className="tabular-nums">
                  {formatDateTime(profile.store.verifiedAt)}
                </p>
              </MetaCard>
              <MetaCard label="Address">
                <p>
                  {profile.store.address}
                  <br />
                  {profile.store.city}, {profile.store.postalCode}
                  <br />
                  {profile.store.country}
                </p>
              </MetaCard>
              <MetaCard label="Description">
                <p className="whitespace-pre-wrap">
                  {profile.store.description || "—"}
                </p>
              </MetaCard>
            </div>
            {profile.store.slug ? (
              <Link
                href={ROUTES.publicStore(profile.store.slug)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" })
                )}
              >
                <ExternalLink className="size-3.5" />
                View public store
              </Link>
            ) : null}
          </section>
        ) : null}
      </div>

      <aside className="bg-muted/40 border-border space-y-4 rounded-xl border p-4 lg:sticky lg:top-28">
        <div className="flex flex-wrap items-center gap-2">
          <SellerStatusBadge status={profile.status} />
          <Badge variant="outline">User #{profile.userId}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {canApprove ? (
            <Button type="button" onClick={() => setApproveOpen(true)}>
              Approve
            </Button>
          ) : null}
          {canReject ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          ) : null}
          {canSuspend ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setSuspendOpen(true)}
            >
              Suspend
            </Button>
          ) : null}
        </div>

        <MetaCard label="Application ID">
          <p className="font-mono">{profile.id}</p>
        </MetaCard>
        <MetaCard label="Submitted">
          <p className="tabular-nums">{formatDateTime(profile.createdAt)}</p>
        </MetaCard>
        <MetaCard label="Approved">
          <p className="tabular-nums">{formatDateTime(profile.approvedAt)}</p>
        </MetaCard>
        <MetaCard label="Last updated">
          <p className="tabular-nums">{formatDateTime(profile.updatedAt)}</p>
        </MetaCard>

        {profile.rejectedReason ? (
          <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4 text-sm">
            <p className="font-medium">Rejection reason</p>
            <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
              {profile.rejectedReason}
            </p>
          </div>
        ) : null}

        <Link
          href={ROUTES.sellerProfiles}
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          All seller applications
        </Link>
      </aside>

      <ApproveSellerProfileDialog
        open={approveOpen}
        profile={profile}
        onOpenChange={setApproveOpen}
      />
      <RejectSellerProfileDialog
        open={rejectOpen}
        profile={profile}
        onOpenChange={setRejectOpen}
      />
      <SuspendSellerProfileDialog
        open={suspendOpen}
        profile={profile}
        onOpenChange={setSuspendOpen}
      />
    </div>
  );
}
