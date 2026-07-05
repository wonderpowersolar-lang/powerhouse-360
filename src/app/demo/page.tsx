import type { Metadata } from "next";
import DemoRequestFunnel from "@/components/funnel/DemoRequestFunnel";

export const metadata: Metadata = {
  title: "Software-Demo anfragen — Powerhouse 360",
  description:
    "Erhalte eine Demo, die zu deinem Objekt, deinen Modulen und deinen aktuellen Prozessen passt. Geführte Anfrage in wenigen Schritten.",
};

export default function DemoPage() {
  return <DemoRequestFunnel />;
}
