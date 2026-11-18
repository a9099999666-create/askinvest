import { SiteHeader } from "@/components/public/SiteHeader";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-atmosphere">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6">
        {children}
      </main>
    </div>
  );
}
