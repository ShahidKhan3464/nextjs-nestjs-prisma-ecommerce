import type { Metadata } from "next";
import { AdminUserDetail } from "@/modules/admin/users";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `User ${id}` };
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminUserDetail userId={id} />;
}
