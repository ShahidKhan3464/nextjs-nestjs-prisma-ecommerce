"use client";

import { Button } from "@/components/ui/button";

export default function ProductsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4 py-20 text-center">
      <p className="font-medium">Something went wrong with products</p>
      <p className="text-muted-foreground text-sm">
        The products view failed to render. You can try again.
      </p>
      <Button type="button" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
