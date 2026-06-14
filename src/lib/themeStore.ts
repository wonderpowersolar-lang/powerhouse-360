/**
 * POWERHOUSE360 — theme store (Dark / Light).
 *
 * A tiny module-level singleton, the same pattern as scrollProgress.ts: the
 * per-frame stage loop (ScrollVideoExperience) and the mobile cards read the
 * active theme imperatively via `getTheme()` without forcing React re-renders,
 * while React UI subscribes through the `useTheme()` hook.
 *
 * Source of truth at runtime is `document.documentElement.dataset.theme`,
 * which the no-flash inline script in app/layout.tsx sets BEFORE first paint
 * (read from localStorage, default dark — the brand's primary register). This
 * module mirrors that value, persists changes, and notifies subscribers.
 */

export type Theme = "dark" | "light";

const STORAGE_KEY = "ph360-theme";

type Listener = (t: Theme) => void;
const listeners = new Set<Listener>();

/** Lazily initialised from the DOM (which the no-flash script already set). */
let current: Theme | null = null;

function readDom(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function getTheme(): Theme {
  if (current === null) current = readDom();
  return current;
}

export function setTheme(next: Theme) {
  current = next;
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked (private mode) — runtime still works, just not persisted */
    }
  }
  listeners.forEach((l) => l(next));
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The localStorage key, exported for the inline no-flash script. */
export const THEME_STORAGE_KEY = STORAGE_KEY;
