import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminTableSkeletonProps } from "../types";
import { AdminFilterToolbarSkeleton } from "./admin-filter-toolbar-skeleton";

const DEFAULT_COLUMNS: NonNullable<AdminTableSkeletonProps["columns"]> = [
  { className: "flex-1 max-w-[28%]" },
  { className: "flex-1 max-w-[28%]" },
  { className: "flex-1 max-w-[28%]" },
  { className: "w-20 shrink-0", isAction: true },
];

const DEFAULT_FILTER_WIDTHS = ["w-72", "w-40", "w-24"];

function TableCellSkeleton({
  column,
}: {
  column: NonNullable<AdminTableSkeletonProps["columns"]>[number];
}) {
  if (column.isAction) {
    return <Skeleton className="h-8 w-20 shrink-0 rounded-md" />;
  }

  const isImageColumn = column.className?.includes("w-16");

  if (isImageColumn) {
    return <Skeleton className="size-10 shrink-0 rounded-md" />;
  }

  return (
    <Skeleton className={cn("h-4 min-w-0", column.className ?? "flex-1")} />
  );
}

export function AdminTableSkeleton({
  rows = 8,
  withToolbar = true,
  columns = DEFAULT_COLUMNS,
  filterWidths = DEFAULT_FILTER_WIDTHS,
}: AdminTableSkeletonProps) {
  return (
    <div className="space-y-4">
      {withToolbar ? (
        <AdminFilterToolbarSkeleton widths={filterWidths} />
      ) : null}
      <div className="overflow-hidden rounded-md border bg-card">
        <div className="border-b px-2 py-3">
          <div className="flex gap-2">
            {columns.map((column, index) => (
              <Skeleton
                key={index}
                className={cn(
                  "h-4 shrink-0",
                  column.isAction
                    ? (column.className ?? "w-20")
                    : (column.className ?? "flex-1")
                )}
              />
            ))}
          </div>
        </div>
        <div className="space-y-0 divide-y p-0">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-2 px-2 py-2.5">
              {columns.map((column, colIndex) => (
                <TableCellSkeleton key={colIndex} column={column} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
