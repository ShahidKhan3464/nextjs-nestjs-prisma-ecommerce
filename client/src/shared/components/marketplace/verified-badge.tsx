import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type VerifiedBadgeProps = {
  className?: string;
  compact?: boolean;
};

export function VerifiedBadge({
  className,
  compact = false,
}: VerifiedBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-normal",
        compact && "px-1.5 py-0 text-[10px]",
        className
      )}
    >
      <BadgeCheck
        className={cn("size-3.5", compact && "size-3")}
        aria-hidden
      />
      Verified
    </Badge>
  );
}
