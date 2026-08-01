"use client";

import { Button } from "@/components/ui/button";

export default function SellerProductManageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4 py-20 text-center">
      <p className="font-medium">Could not load this product</p>
      <p className="text-muted-foreground text-sm">
        Something went wrong while opening product details.
      </p>
      <Button type="button" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
