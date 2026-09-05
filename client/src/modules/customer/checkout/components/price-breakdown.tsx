"use client";

import type { CheckoutPreview } from "../types";
import { formatMoney } from "../utils/format-money";

type Props = {
  /** Prefer backend preview totals when a session exists. */
  preview: CheckoutPreview | null;
  /** Cart merchandise subtotal used before session creation. */
  merchandiseSubtotal: number;
  /** Soft estimate before server pricing is available. */
  showEstimate?: boolean;
};

export function PriceBreakdown({
  preview,
  merchandiseSubtotal,
  showEstimate = true,
}: Props) {
  const usingServer = Boolean(preview);
  const subtotal = preview?.subtotal ?? merchandiseSubtotal;
  const tax = preview?.tax ?? 0;
  const total = preview?.total ?? merchandiseSubtotal;

  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Merchandise</span>
        <span className="tabular-nums">{formatMoney(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Shipping</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          Calculated by store
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          Tax{usingServer || !showEstimate ? "" : " (est.)"}
        </span>
        <span className="tabular-nums">{formatMoney(tax)}</span>
      </div>
      <div className="flex justify-between pt-2 font-semibold">
        <span>
          Total
          {!usingServer && showEstimate ? " (est.)" : ""}
        </span>
        <span className="tabular-nums">{formatMoney(total)}</span>
      </div>
      {usingServer ? (
        <p className="text-muted-foreground pt-1 text-xs">
          Totals confirmed by the server. Your card will be charged this amount.
        </p>
      ) : null}
    </div>
  );
}
