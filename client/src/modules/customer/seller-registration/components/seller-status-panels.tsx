"use client";

import Link from "next/link";
import { toast } from "sonner";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useRouter } from "next/navigation";
import type { SellerProfile } from "../types";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/api-error";
import { isSeller } from "@/modules/auth/utils/roles";
import { SellerStatusBadge } from "./seller-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { SellerDocumentUpload } from "./seller-document-upload";
import { SellerApplicationForm } from "./seller-application-form";
import { refreshSellerSession } from "../services/seller-profile.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Ban,
  Clock3,
  CircleAlert,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";

function StatusShell({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
          {icon}
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              {title}
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function SellerPendingPanel({ profile }: { profile: SellerProfile }) {
  return (
    <StatusShell
      icon={<Clock3 className="size-5" />}
      title="Application under review"
      description="Our team is reviewing your seller application. You can update details or upload documents while you wait."
    >
      <div className="flex flex-wrap items-center gap-2">
        <SellerStatusBadge status={profile.status} />
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <LoaderCircle className="size-3.5 animate-spin" />
          Checking for updates…
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business details</CardTitle>
        </CardHeader>
        <CardContent>
          <SellerApplicationForm mode="update" profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification documents</CardTitle>
        </CardHeader>
        <CardContent>
          <SellerDocumentUpload documents={profile.documents} />
        </CardContent>
      </Card>
    </StatusShell>
  );
}

export function SellerApprovedPanel({ profile }: { profile: SellerProfile }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [activating, setActivating] = React.useState(false);
  const hasSellerRole = isSeller(user?.roles ?? []);

  async function activateSellerPortal() {
    setActivating(true);
    try {
      await refreshSellerSession();
      toast.success("Seller portal unlocked");
      router.refresh();
      router.push(ROUTES.dashboard);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Could not refresh your session. Sign out and sign in again."
        )
      );
    } finally {
      setActivating(false);
    }
  }

  return (
    <StatusShell
      icon={<CheckCircle2 className="size-5" />}
      title="You're approved to sell"
      description="Your seller profile is approved. Open the seller portal to manage your storefront."
    >
      <div className="flex flex-wrap items-center gap-2">
        <SellerStatusBadge status={profile.status} />
        {profile.store ? (
          <span className="text-muted-foreground text-xs">
            Store: {profile.store.name}
          </span>
        ) : null}
      </div>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Business</dt>
              <dd className="font-medium">{profile.businessName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{profile.businessEmail}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{profile.businessPhone}</dd>
            </div>
            {profile.approvedAt ? (
              <div>
                <dt className="text-muted-foreground">Approved</dt>
                <dd className="font-medium">
                  {new Date(profile.approvedAt).toLocaleDateString()}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="flex flex-wrap gap-2 pt-2">
            {hasSellerRole ? (
              <Link
                href={ROUTES.dashboard}
                className={cn(buttonVariants({ size: "default" }))}
              >
                Go to seller dashboard
              </Link>
            ) : (
              <Button onClick={() => void activateSellerPortal()} disabled={activating}>
                {activating ? "Activating…" : "Activate seller portal"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </StatusShell>
  );
}

export function SellerRejectedPanel({ profile }: { profile: SellerProfile }) {
  return (
    <StatusShell
    title="Application not approved"
      icon={<CircleAlert className="size-5" />}
      description="Your seller application was rejected. Review the reason below and contact support if you need help reapplying."
    >
      <SellerStatusBadge status={profile.status} />

      <Card>
        <CardHeader>
          <CardTitle>Rejection reason</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">
            {profile.rejectedReason?.trim() ||
              "No reason was provided. Please contact support for details."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submitted business details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Business</dt>
              <dd className="font-medium">{profile.businessName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{profile.businessEmail}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{profile.businessPhone}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </StatusShell>
  );
}

export function SellerSuspendedPanel({ profile }: { profile: SellerProfile }) {
  return (
    <StatusShell
      icon={<Ban className="size-5" />}
      title="Seller account suspended"
      description="Selling privileges are paused. Contact support to resolve the suspension before listing products again."
    >
      <SellerStatusBadge status={profile.status} />

      <Card>
        <CardContent className="space-y-3 pt-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Business</dt>
              <dd className="font-medium">{profile.businessName}</dd>
            </div>
            {profile.store ? (
              <>
                <div>
                  <dt className="text-muted-foreground">Store</dt>
                  <dd className="font-medium">{profile.store.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Store status</dt>
                  <dd className="font-medium">{profile.store.status}</dd>
                </div>
                {profile.store.suspendedAt ? (
                  <div>
                    <dt className="text-muted-foreground">Suspended</dt>
                    <dd className="font-medium">
                      {new Date(profile.store.suspendedAt).toLocaleDateString()}
                    </dd>
                  </div>
                ) : null}
              </>
            ) : null}
          </dl>
          <p className="text-muted-foreground text-sm">
            Document uploads and profile edits are disabled while suspended.
          </p>
        </CardContent>
      </Card>
    </StatusShell>
  );
}
