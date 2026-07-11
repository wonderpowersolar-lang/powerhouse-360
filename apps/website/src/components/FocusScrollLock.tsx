"use client";

import { useEffect } from "react";
import { useLenis } from "lenis/react";
import { useFocusId } from "@/lib/focusStore";

/**
 * Locks page scroll while a module is focused so the overview stays a stable
 * stage during the fly-in (NRG behaviour). On focus we `lenis.stop()` (and pin
 * the body as a belt-and-braces guard against native/touch scroll); on clear we
 * `lenis.start()` and release. Because the explorer is entered from the hero /
 * finale overview bands, the page scroll position is preserved underneath, so
 * returning lands the user back exactly where they opened the explorer.
 *
 * Renders nothing; re-renders only when focusId flips.
 */
export default function FocusScrollLock() {
  const focusId = useFocusId();
  const lenis = useLenis();

  useEffect(() => {
    const focused = focusId !== null;
    if (focused) {
      lenis?.stop();
      document.documentElement.style.setProperty("overflow", "clip");
    } else {
      lenis?.start();
      document.documentElement.style.removeProperty("overflow");
    }
    return () => {
      // Safety: never leave the page locked if this unmounts mid-focus.
      lenis?.start();
      document.documentElement.style.removeProperty("overflow");
    };
  }, [focusId, lenis]);

  return null;
}
