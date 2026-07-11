import HeatStoryBridge from "./HeatStoryBridge";
import HeatHero from "./HeatHero";
import HeatStory from "./HeatStory";
import HeatSections from "./HeatSections";
import HeatCta from "./HeatCta";

/**
 * HeatMobile — die leichte gestapelte HeatMieter-Journey für schmale Viewports,
 * groben Pointer oder reduzierte Bewegung: klassischer Hero → Scroll-Story
 * (Zwei Winter, sticky Frame-Scrub) → Sachsektionen → Final-CTA. Bewährt und
 * eigenständig; die Desktop-Cine-Journey (HeatDesktop) baut auf denselben Daten
 * auf. Die Bridge speist den Story-Store (lib/heatProgress).
 */
export default function HeatMobile() {
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
