import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorView({
  title = "Something went wrong",
  message = "Please try again in a moment.",
  onRetry,
  retryLabel = "Try again",
  className,
}: Props) {
  return (
    <div
      role="alert"
      className={cn(
        "border-border bg-muted/30 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center",
        className
      )}
    >
      <AlertCircle className="text-muted-foreground mb-3 size-8" aria-hidden />
      <p className="font-medium">{title}</p>
      {message ? (
        <p className="text-muted-foreground mt-2 max-w-md text-sm">{message}</p>
      ) : null}
      {onRetry ? (
        <div className="mt-6">
          <Button type="button" variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
