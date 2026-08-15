import { BecomeSellerView } from "@/modules/buyer/seller-registration";

export default function BecomeSellerPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="space-y-0.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Become a seller
        </h1>
        <p className="text-muted-foreground text-sm">
          Apply with your business details and verification documents.
        </p>
      </header>
      <BecomeSellerView />
    </div>
  );
}
