import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { OrderDetailView } from "@/modules/buyer/orders";
import { AdminOrderDetail } from "@/modules/admin/orders";
import { SellerOrderDetail } from "@/modules/seller/orders";
import { getAccessTokenPayload } from "@/lib/session-cookie";
import { isSeller, isSuperAdmin } from "@/modules/auth/utils/roles";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order ${id}`,
    description: `Order details — ${siteConfig.name}`,
  };
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const session = await getAccessTokenPayload();

  if (session && isSuperAdmin(session.roles)) {
    return <AdminOrderDetail orderId={id} />;
  }

  if (session && isSeller(session.roles)) {
    return <SellerOrderDetail orderId={id} />;
  }

  return <OrderDetailView orderId={id} />;
}
