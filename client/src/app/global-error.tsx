"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            An unexpected error occurred. Please try again.
          </p>
          {error.digest ? (
            <p className="text-muted-foreground mt-4 font-mono text-xs">
              Ref: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            className="bg-primary text-primary-foreground mt-8 rounded-md px-4 py-2 text-sm font-medium"
            onClick={() => reset()}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
