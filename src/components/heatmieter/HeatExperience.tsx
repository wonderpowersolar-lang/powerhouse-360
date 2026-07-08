import HeatStoryBridge from "./HeatStoryBridge";
import HeatHero from "./HeatHero";
import HeatStory from "./HeatStory";
import HeatSections from "./HeatSections";
import HeatCta from "./HeatCta";

/**
 * HeatExperience — komponiert die vier Akte der /heatmieter-Seite:
 * klassischer Hero → Scroll-Story (Zwei Winter) → Sachsektionen →
 * Final-CTA. Die Bridge speist den Story-Store; nur Story/Bridge/Nav
 * sind Client-Komponenten, der Rest rendert serverseitig.
 */
export default function HeatExperience() {
  return (
    <>
      <HeatStoryBridge />
      <HeatHero />
      <HeatStory />
      <HeatSections />
      <HeatCta />
    </>
  );
}
