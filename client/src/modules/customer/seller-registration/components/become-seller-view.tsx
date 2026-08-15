"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Store } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { isSuperAdmin } from "@/modules/auth/utils/roles";
import { Button, buttonVariants } from "@/components/ui/button";
import { SellerApplicationForm } from "./seller-application-form";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { fetchMySellerProfile } from "../services/seller-profile.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SellerPendingPanel,
  SellerApprovedPanel,
  SellerRejectedPanel,
  SellerSuspendedPanel,
} from "./seller-status-panels";

function BecomeSellerSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

function BecomeSellerIntro() {
  return (
    <div className="flex items-center gap-2 space-y-2">
      <div className="bg-muted text-foreground flex size-10 items-center justify-center rounded-full gap-2 mb-0">
        <Store className="size-5" />
      </div>
      <p className="text-muted-foreground max-w-2xl text-sm">
        Once approved, you&apos;ll unlock the seller portal to manage listings
        and orders.
      </p>
    </div>
  );
}

export function BecomeSellerView() {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? [];
  const admin = isSuperAdmin(roles);

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    enabled: !admin,
    refetchOnWindowFocus: true,
    queryFn: fetchMySellerProfile,
    queryKey: queryKeys.sellerProfile.me,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" ? 15_000 : false;
    },
  });

  if (admin) {
    return (
      <EmptyState
        title="Seller registration is for buyers"
        description="Admin accounts manage seller applications from the admin tools rather than applying here."
        action={
          <Link
            href={ROUTES.dashboard}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Back to dashboard
          </Link>
        }
      />
    );
  }

  if (isPending) {
    return <BecomeSellerSkeleton />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Could not load seller status"
        description={getApiErrorMessage(error, "Please try again.")}
        action={
          <Button size="sm" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? "Retrying…" : "Retry"}
          </Button>
        }
      />
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl space-y-6">
        <BecomeSellerIntro />
        <Card>
          <CardHeader>
            <CardTitle>Seller application</CardTitle>
          </CardHeader>
          <CardContent>
            <SellerApplicationForm mode="create" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-2">
      {data.status === "PENDING" ? <SellerPendingPanel profile={data} /> : null}
      {data.status === "APPROVED" ? (
        <SellerApprovedPanel profile={data} />
      ) : null}
      {data.status === "REJECTED" ? (
        <SellerRejectedPanel profile={data} />
      ) : null}
      {data.status === "SUSPENDED" ? (
        <SellerSuspendedPanel profile={data} />
      ) : null}
    </div>
  );
}
