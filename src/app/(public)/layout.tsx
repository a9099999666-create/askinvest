import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";

export const revalidate = 60;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-atmosphere">
      <div className="relative">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 pb-6 md:px-6">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
