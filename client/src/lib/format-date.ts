import { format } from "date-fns";

/** Order list "Placed" column — date only (YYYY-MM-DD). */
export function formatOrderDate(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd");
}
