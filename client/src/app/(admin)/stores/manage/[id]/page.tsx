import type { Metadata } from "next";
import { AdminStoreDetail } from "@/modules/admin/stores";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Store ${id}` };
}

export default async function AdminStoreDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminStoreDetail storeId={id} />;
}
