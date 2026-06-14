"use client";

import { useSyncExternalStore } from "react";
import { getTheme, subscribeTheme, type Theme } from "@/lib/themeStore";

/**
 * Subscribe a React component to the active theme. The SSR snapshot is always
 * "dark" (matching the SSR'd <html data-theme="dark">), so any theme-branching
 * MARKUP must be mount-gated by the caller to stay hydration-safe. Client-only
 * components (the ssr:false stage) can use the value directly.
 */
export function useTheme(): Theme {
  return useSyncExternalStore<Theme>(subscribeTheme, getTheme, () => "dark");
}
