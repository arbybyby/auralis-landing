"use client";

import { useReveal } from "@/hooks/useReveal";

/** Runs the page's scroll reveals; renders nothing. */
export function ScrollReveals() {
  useReveal();
  return null;
}
