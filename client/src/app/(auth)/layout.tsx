import { SiteShell } from "@/shared/components/layout/site-shell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteShell showFooter={false}>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
        <div className="bg-card border-border w-full max-w-md rounded-2xl border p-8 shadow-sm">
          {children}
        </div>
      </div>
    </SiteShell>
  );
}
