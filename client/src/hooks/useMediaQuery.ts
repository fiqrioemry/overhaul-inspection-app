import { useSyncExternalStore } from "react";

/**
 * Subscribe to a CSS media query and re-render when it matches/unmatches.
 * Uses useSyncExternalStore so the value stays in sync with the browser
 * without effect-driven state updates. Returns `false` during SSR.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };

  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
