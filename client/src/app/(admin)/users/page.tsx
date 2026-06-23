import type { Metadata } from "next";
import { AdminUsersList } from "@/modules/admin/users";

export const metadata: Metadata = {
  title: "Users",
};

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Users
        </h1>
        <p className="text-muted-foreground text-sm">
          Everyone who has created an account—review roles and contact details
          in one place.
        </p>
      </header>

      <AdminUsersList />
    </div>
  );
}
