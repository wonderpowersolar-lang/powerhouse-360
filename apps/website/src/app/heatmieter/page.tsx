import type { Metadata } from "next";
import HeatNav from "@/components/heatmieter/HeatNav";
import HeatExperience from "@/components/heatmieter/HeatExperience";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title:
    "Heatmieter — Heizkostenabrechnung im Mehrfamilienhaus | Powerhouse 360",
  description:
    "HeatMieter macht Heizkosten transparent: fernablesbare Erfassung, Monatswerte je Wohnung, Einsparpotenziale, CO₂-Kostenaufteilung und eine nachvollziehbare Heizkostenabrechnung — für Eigentümer, WEGs und Hausverwaltungen.",
  openGraph: {
    title: "Heatmieter — Heizkostenabrechnung im Mehrfamilienhaus",
    description:
      "Erfasst, transparent, nachvollziehbar abgerechnet: die digitale Wärme-Ebene für Mehrfamilienhäuser.",
    type: "website",
    locale: "de_DE",
    images: [
      {
        url: "/media/heatmieter/winter.jpg",
        width: 2400,
        height: 1350,
        alt: "Mehrfamilienhaus im Winter bei Blue Hour — HeatMieter",
      },
    ],
  },
};

export default function HeatMieterPage() {
  return (
    <>
      <HeatNav />
      <main>
        <HeatExperience />
      </main>
      <Footer />
    </>
  );
}
