import { ProfileForm } from "@/modules/buyer/profile";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Keep your name and contact information current for orders and
          receipts.
        </p>
      </header>
      <ProfileForm />
    </div>
  );
}
