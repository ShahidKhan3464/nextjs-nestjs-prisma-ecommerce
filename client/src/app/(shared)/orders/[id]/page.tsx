import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { AdminOrderDetail } from "@/modules/admin/orders";
import { OrderDetailView } from "@/modules/customer/orders";
import { getAccessTokenPayload } from "@/lib/session-cookie";

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

  if (session?.role === "admin") {
    return <AdminOrderDetail orderId={id} />;
  }

  return <OrderDetailView orderId={id} />;
}
