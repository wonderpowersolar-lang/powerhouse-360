"use client";

import { useEffect, useState } from "react";
import { toggleTheme } from "@/lib/themeStore";
import { useTheme } from "./useTheme";

/**
 * Dark / Light switch. Lives in the Nav. Flips `document.documentElement`'s
 * data-theme (via the store), which re-themes the whole site through the CSS
 * token overrides in globals.css and swaps every scene asset to its matching
 * dark/light render. The icon is mount-gated so the first client render matches
 * the SSR'd markup (no hydration mismatch).
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      aria-label={isDark ? "Zu hellem Modus wechseln" : "Zu dunklem Modus wechseln"}
      title={isDark ? "Light Mode" : "Dark Mode"}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--toggle-border)] bg-[color:var(--toggle-bg)] text-ink transition-colors duration-300 hover:bg-[color:var(--toggle-bg-hover)] ${className}`}
    >
      <span className="sr-only">Theme umschalten</span>
      {!mounted ? (
        <span className="h-[18px] w-[18px]" aria-hidden />
      ) : isDark ? (
        // currently dark → icon offers the light side (moon)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        // currently light → icon offers the dark side (sun)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.6" />
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 2.6v2.1M12 19.3v2.1M21.4 12h-2.1M4.7 12H2.6M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5M18.6 18.6l-1.5-1.5M6.9 6.9 5.4 5.4" />
          </g>
        </svg>
      )}
    </button>
  );
}
