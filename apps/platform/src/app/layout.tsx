import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
