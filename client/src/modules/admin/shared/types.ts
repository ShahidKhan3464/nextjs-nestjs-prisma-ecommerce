type AdminTableColumnSkeleton = {
  /** Tailwind width/layout classes for header and body cells. */
  className?: string;
  /** Narrow action column (icon buttons). */
  isAction?: boolean;
};

export type AdminTableSkeletonProps = {
  /** Number of placeholder rows in the table body. */
  rows?: number;
  /** When true, renders toolbar placeholders above the table. */
  withToolbar?: boolean;
  /** Table columns — header and body skeletons match this layout. */
  columns?: AdminTableColumnSkeleton[];
  /** Width classes for each filter control skeleton (search, selects, buttons). */
  filterWidths?: string[];
};
