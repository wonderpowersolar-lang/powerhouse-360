import SmokeStoryBridge from "./SmokeStoryBridge";
import SmokeHero from "./SmokeHero";
import SmokeStory from "./SmokeStory";
import SmokeSections from "./SmokeSections";
import SmokeCta from "./SmokeCta";

/**
 * SmokeExperience — komponiert die vier Akte der /smokemieter-Seite:
 * klassischer Hero → Scroll-Story → Sachsektionen → Final-CTA.
 * Die Bridge speist den Story-Store; nur Story/Bridge/Nav sind Client-
 * Komponenten, der Rest rendert serverseitig.
 */
export default function SmokeExperience() {
  return (
    <>
      <SmokeStoryBridge />
      <SmokeHero />
      <SmokeStory />
      <SmokeSections />
      <SmokeCta />
    </>
  );
}
