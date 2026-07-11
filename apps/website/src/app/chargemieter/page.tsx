import type { Metadata } from "next";
import ChargeNav from "@/components/chargemieter/ChargeNav";
import ChargeExperience from "@/components/chargemieter/ChargeExperience";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  // Eigenes Tab-Icon der Modul-Seite (überschreibt das geerbte
  // Powerhouse-Icon aus dem Root-Layout — greift auch auf chargemieter.de).
  icons: {
    icon: [
      { url: "/chargemieter/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/chargemieter/icon.png" }],
  },
  title: "ChargeMieter — Wallboxen im Mehrfamilienhaus | Powerhouse 360",
  description:
    "ChargeMieter macht Ladeinfrastruktur im Mehrfamilienhaus planbar, steuerbar und abrechenbar: Förderprüfung, Planung, Lastmanagement und nutzerbezogene Abrechnung für WEGs, Hausverwaltungen und Eigentümer.",
  openGraph: {
    title: "ChargeMieter — Wallboxen im Mehrfamilienhaus",
    description:
      "Geplant, gesteuert und sauber abgerechnet: die Komplettlösung für Ladeinfrastruktur im Mehrfamilienhaus.",
    type: "website",
    locale: "de_DE",
    images: [
      {
        url: "/media/chargemieter/hero.jpg",
        width: 1600,
        height: 900,
        alt: "Elektroauto an einer Wallbox vor einem Mehrfamilienhaus bei Nacht",
      },
    ],
  },
};

export default function ChargeMieterPage() {
  return (
    <>
      <ChargeNav />
      <main>
        <ChargeExperience />
      </main>
      <Footer />
    </>
  );
}
