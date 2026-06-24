"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4 text-center">
      <p className="font-medium">Something went wrong</p>
      <Button type="button" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
