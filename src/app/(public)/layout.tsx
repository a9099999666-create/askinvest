import { SiteHeader } from "@/components/public/SiteHeader";

export const revalidate = 60;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-atmosphere">
      <link rel="preload" href="/brand/home-glass.webp" as="image" type="image/webp" />
      <link rel="preload" href="/brand/logo.png" as="image" type="image/png" />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6">
        {children}
      </main>
    </div>
  );
}
