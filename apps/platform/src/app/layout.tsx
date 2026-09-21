import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Powerhouse 360 — Plattform",
  description: "Interne Plattform: CRM, Onboarding, Geräte, Abrechnung.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={sora.variable}>
      <body>{children}</body>
    </html>
  );
}
