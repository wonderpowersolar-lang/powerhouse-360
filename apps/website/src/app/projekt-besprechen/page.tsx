import type { Metadata } from "next";
import ProjectRequestFunnel from "@/components/funnel/ProjectRequestFunnel";

export const metadata: Metadata = {
  title: "Projekt besprechen — Powerhouse 360",
  description:
    "Prüfe, welche Powerhouse-360-Module für dein Objekt sinnvoll sind und welcher nächste Schritt passt. Geführte Projektanfrage in wenigen Schritten.",
};

export default function ProjectPage() {
  return <ProjectRequestFunnel />;
}
