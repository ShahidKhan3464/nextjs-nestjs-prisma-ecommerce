import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import { AdminPaymentDetail } from "@/modules/admin/payments";
import { SellerPaymentDetail } from "@/modules/seller/payments";
import { isSeller, isSuperAdmin } from "@/modules/auth/utils/roles";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Payment ${id}`,
    description: `Payment details — ${siteConfig.name}`,
  };
}

export default async function PaymentDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getAccessTokenPayload();

  if (session && isSuperAdmin(session.roles)) {
    return <AdminPaymentDetail paymentId={id} />;
  }

  if (session && isSeller(session.roles)) {
    return <SellerPaymentDetail paymentId={id} />;
  }

  redirect(ROUTES.dashboard);
}
