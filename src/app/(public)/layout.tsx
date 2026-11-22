import { PhilosopherStage } from "@/components/public/PhilosopherStage";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";

export const revalidate = 60;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site-public relative min-h-dvh overflow-x-hidden bg-void">
      <PhilosopherStage variant="ambient" />
      <div className="relative z-10">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:px-6">
          {children}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
