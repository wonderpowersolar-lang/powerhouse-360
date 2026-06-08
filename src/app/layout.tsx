import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "POWERHOUSE360 — Das Building-OS für Mehrfamilienhäuser",
  description:
    "POWERHOUSE360 macht Mehrfamilienhäuser energieaktiv: Solarstrom, Wärme, Messung, Abrechnung und Betrieb – verbunden in einem intelligenten Gebäudesystem.",
  metadataBase: new URL("https://powerhouse360.example"),
  openGraph: {
    title: "POWERHOUSE360 — Das Building-OS für Mehrfamilienhäuser",
    description:
      "Aus einem Mehrfamilienhaus wird ein intelligentes Energie-Asset.",
    type: "website",
    locale: "de_DE",
  },
  icons: {
    icon: "/brand/logo.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1626",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${sora.variable} antialiased`}>
      <body className="min-h-dvh bg-navy-900 text-ink">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
