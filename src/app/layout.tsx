import type { Metadata } from "next";
import { Manrope, Onest } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

export const metadata: Metadata = {
  title: "АСКИНВЕСТ",
  description: "Услуги для бизнеса и коммерческая недвижимость",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${onest.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
