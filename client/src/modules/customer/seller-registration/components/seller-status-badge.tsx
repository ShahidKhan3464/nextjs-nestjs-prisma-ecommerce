import { Badge } from "@/components/ui/badge";
import type { SellerProfileStatus } from "../types";

const LABELS: Record<SellerProfileStatus, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

const VARIANTS: Record<
  SellerProfileStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  SUSPENDED: "outline",
};

export function SellerStatusBadge({ status }: { status: SellerProfileStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
