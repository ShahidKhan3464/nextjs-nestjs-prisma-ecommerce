import { Suspense } from "react";
import { ProfileView } from "@/modules/buyer/profile";

export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your account settings and saved addresses for orders and
          checkout.
        </p>
      </header>
      <Suspense fallback={null}>
        <ProfileView />
      </Suspense>
    </div>
  );
}
