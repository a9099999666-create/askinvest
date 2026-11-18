import { SiteHeader } from "@/components/public/SiteHeader";

export const revalidate = 60;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-atmosphere">
      <div className="atmosphere-wash pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
