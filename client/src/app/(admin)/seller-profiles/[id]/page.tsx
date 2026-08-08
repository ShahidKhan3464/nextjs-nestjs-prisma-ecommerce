import type { Metadata } from "next";
import { AdminSellerProfileDetail } from "@/modules/admin/seller-profiles";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Seller application ${id}` };
}

export default async function SellerProfileDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminSellerProfileDetail profileId={id} />;
}
