import type { Metadata } from "next";
import SmokeNav from "@/components/smokemieter/SmokeNav";
import SmokeExperience from "@/components/smokemieter/SmokeExperience";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "SmokeMieter — Rauchwarnmelder im Mehrfamilienhaus | Powerhouse 360",
  description:
    "SmokeMieter macht die Rauchwarnmelder-Pflicht betreibbar: Montage, Ferninspektion ohne Wohnungszutritt, Live-Status, Ereigniskommunikation und lückenlose Dokumentation — für Eigentümer, WEGs und Hausverwaltungen.",
  openGraph: {
    title: "SmokeMieter — Rauchwarnmelder im Mehrfamilienhaus",
    description:
      "Montiert, ferngeprüft, dokumentiert: die Komplettlösung für Rauchwarnmelder im Mehrfamilienhaus.",
    type: "website",
    locale: "de_DE",
    images: [
      {
        url: "/media/smokemieter/dawn.jpg",
        width: 2400,
        height: 1350,
        alt: "Mehrfamilienhaus im ersten Morgenlicht — SmokeMieter",
      },
    ],
  },
};

export default function SmokeMieterPage() {
  return (
    <>
      <SmokeNav />
      <main>
        <SmokeExperience />
      </main>
      <Footer />
    </>
  );
}
