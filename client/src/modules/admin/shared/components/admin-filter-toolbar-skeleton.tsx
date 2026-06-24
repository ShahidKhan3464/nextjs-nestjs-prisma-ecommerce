import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  /** Tailwind width classes per filter slot, e.g. `w-72`, `w-40`. */
  widths: string[];
  className?: string;
};

export function AdminFilterToolbarSkeleton({ widths, className }: Props) {
  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      {widths.map((width, index) => (
        <Skeleton
          key={`${width}-${index}`}
          className={cn("h-10 shrink-0 rounded-md", width)}
        />
      ))}
    </div>
  );
}
