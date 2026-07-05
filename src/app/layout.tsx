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
  title: "Powerhouse 360 — Das Betriebssystem deiner Immobilie",
  description:
    "Powerhouse 360 verbindet Energie, Wärme, Ladeinfrastruktur, Sicherheit und digitale Prozesse in einem zentralen Betriebssystem für Mehrfamilienhäuser.",
  metadataBase: new URL("https://powerhouse360.example"),
  openGraph: {
    title: "Powerhouse 360 — Das Betriebssystem deiner Immobilie",
    description:
      "Eine Plattform für Energie, Wärme, Ladeinfrastruktur, Sicherheit und digitale Prozesse im Mehrfamilienhaus.",
    type: "website",
    locale: "de_DE",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Powerhouse 360 — Mehrfamilienhaus auf schwarzem Sockel im Studio-Licht",
      },
    ],
  },
  icons: {
    icon: "/brand/logo.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
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
