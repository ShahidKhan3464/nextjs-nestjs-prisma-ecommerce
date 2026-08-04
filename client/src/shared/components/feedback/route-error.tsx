"use client";

import { ErrorView } from "@/shared/components/marketplace/error-view";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
};

/** Shared segment error UI — logs digest once for supportability. */
export function RouteError({
  error,
  reset,
  title = "Something went wrong",
  message = "Please try again in a moment.",
}: Props) {
  if (typeof window !== "undefined" && error.digest) {
    // Keep digest available in the browser console for support.
    console.error(`[route-error] ${error.message} (digest: ${error.digest})`);
  }

  return (
    <div className="py-10">
      <ErrorView title={title} message={message} onRetry={reset} />
    </div>
  );
}
