import type { NumberedItem } from "@/content/types";

export interface HowItWorksContent {
  title: string;
  steps: NumberedItem[];
}

export const howItWorks: HowItWorksContent = {
  title: "From raw signal to clear decision",
  steps: [
    {
      number: "01",
      title: "Connect",
      text: "Link satellite feeds, IoT sensors and your own datasets in minutes.",
    },
    {
      number: "02",
      title: "Fuse",
      text: "Auralis aligns every signal in space and time into one model.",
    },
    {
      number: "03",
      title: "Anticipate",
      text: "AI explains what's changing and what happens next, in plain language.",
    },
  ],
};
