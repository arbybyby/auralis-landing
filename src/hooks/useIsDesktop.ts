import { useSyncExternalStore } from "react";

import { DESKTOP_QUERY } from "@/lib/constants";

function subscribe(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(DESKTOP_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

// Only the client-side canvas reads this, so the server answer never reaches the screen.
function getServerSnapshot(): boolean {
  return true;
}

/** Whether the desktop layout applies (Tailwind's `lg` and up), kept current across resizes. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
