import type { ContentLink } from "@/content/types";

export interface SiteContent {
  name: string;
  title: string;
  description: string;
  skipLink: string;
  nav: ContentLink[];
  navCta: ContentLink;
  navLabels: {
    primary: string;
    openMenu: string;
    closeMenu: string;
  };
}

export const site: SiteContent = {
  name: "Auralis",
  title: "Auralis — See the planet think",
  description:
    "Auralis fuses satellite, sensor and climate data into one living 3D model, and lets AI explain what's changing before it happens.",
  skipLink: "Skip to content",
  nav: [
    { label: "Platform", href: "#platform" },
    { label: "How it works", href: "#how" },
    { label: "Use cases", href: "#use-cases" },
    { label: "Access", href: "#access" },
  ],
  navCta: { label: "Request access", href: "#access" },
  navLabels: {
    primary: "Primary",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
};
