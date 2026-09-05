"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Address } from "../types";
import { ROUTES } from "@/constants/routes";
import type { UserAddress } from "@/modules/buyer/addresses/types";

type Props = {
  address: Partial<Address> | UserAddress | null;
  label?: string;
  className?: string;
  showManageLink?: boolean;
};

export function CheckoutAddressCard({
  address,
  label = "Shipping address",
  className,
  showManageLink = false,
}: Props) {
  if (!address?.fullName || !address.line1) {
    return (
      <div
        className={cn("rounded-lg border border-dashed p-4 text-sm", className)}
      >
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground mt-1">No address selected yet.</p>
        {showManageLink ? (
          <Link
            href={ROUTES.addresses}
            className="text-primary mt-2 inline-block text-xs hover:underline"
          >
            Manage addresses
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border p-4 text-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">{label}</p>
        {showManageLink ? (
          <Link
            href={ROUTES.addresses}
            className="text-muted-foreground hover:text-foreground shrink-0 text-xs"
          >
            Manage
          </Link>
        ) : null}
      </div>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        {address.fullName}
        <br />
        {address.line1}
        {address.line2 ? (
          <>
            <br />
            {address.line2}
          </>
        ) : null}
        <br />
        {address.city}, {address.region} {address.postalCode}
        <br />
        {address.country}
        {address.phone ? (
          <>
            <br />
            {address.phone}
          </>
        ) : null}
      </p>
    </div>
  );
}
