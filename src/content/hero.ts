import { site } from "@/content/site";
import type { ContentLink } from "@/content/types";

export interface HeroContent {
  eyebrow: string;
  headline: { lead: string; accent: string; end: string };
  subtitle: string;
  primaryCta: ContentLink;
  secondaryCta: ContentLink;
  hints: { cursor: string; tilt: string; scroll: string };
}

export const hero: HeroContent = {
  eyebrow: "Earth intelligence platform",
  headline: { lead: "See the planet ", accent: "think", end: "." },
  subtitle: site.description,
  primaryCta: { label: "Request early access", href: "#access" },
  secondaryCta: { label: "Watch the demo", href: "#live" },
  hints: {
    cursor: "Move your cursor to explore",
    tilt: "Tilt your device",
    scroll: "Scroll",
  },
};
