import type { Metadata } from "next";
import Nav from "@/components/Nav";
import PowerExperience from "@/components/powermieter/PowerExperience";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Powermieter — Mieterstrom komplett betrieben | Powerhouse 360",
  description:
    "Powermieter macht Mieterstrom im Mehrfamilienhaus betreibbar: PV und Speicher, Messkonzept, digitale Verträge, dynamischer Sonnenstrompreis und Abrechnung — komplett übernommen für WEGs, Hausverwaltungen und Eigentümer.",
  openGraph: {
    title: "Powermieter — Mieterstrom komplett betrieben",
    description:
      "Solarstrom vom eigenen Dach für Bewohner — und für Eigentümer ein Projekt ohne eigenen Betriebsaufwand.",
    type: "website",
    locale: "de_DE",
    images: [
      {
        url: "/media/stills/powermieter.jpg",
        width: 1600,
        height: 900,
        alt: "Zählerwand eines Mehrfamilienhauses mit digitalen Messstellen",
      },
    ],
  },
};

export default function PowermieterPage() {
  return (
    <>
      <Nav />
      <main>
        <PowerExperience />
      </main>
      <Footer />
    </>
  );
}
