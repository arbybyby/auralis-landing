import { site } from "@/content/site";
import type { ContentLink } from "@/content/types";

export interface EmailFormContent {
  label: string;
  placeholder: string;
  submit: string;
  invalid: string;
  success: string;
}

export interface FinalCtaContent {
  title: string;
  text: string;
  form: EmailFormContent;
}

export interface FooterContent {
  nav: ContentLink[];
  copyright: string;
  disclaimer: string;
}

export const finalCta: FinalCtaContent = {
  title: "Give your team a planet-scale view.",
  text: "Join the early access list. We onboard a limited number of teams each month.",
  form: {
    label: "Work email",
    placeholder: "you@company.com",
    submit: "Request early access",
    invalid: "Enter a valid email address.",
    success: "You're on the list.",
  },
};

export const footer: FooterContent = {
  nav: site.nav,
  copyright: "© 2026 Auralis",
  disclaimer: "Auralis is a fictional concept created for portfolio purposes.",
};
