import type { NumberedItem } from "@/content/types";

export interface FeaturesContent {
  title: string;
  items: NumberedItem[];
}

export const features: FeaturesContent = {
  title: "Built to see further",
  items: [
    {
      number: "01",
      title: "Live Earth Model",
      text: "Every satellite pass, sensor ping and weather cell fused into a single, continuously updated 3D model.",
    },
    {
      number: "02",
      title: "Predictive AI",
      text: "Models trained on decades of observations flag shifts days before they surface in the data.",
    },
    {
      number: "03",
      title: "Natural-language queries",
      text: "Ask “Where will wildfire risk peak next week?” and watch the planet answer.",
    },
    {
      number: "04",
      title: "Open API",
      text: "REST and streaming endpoints, typed SDKs and webhooks. Plug Auralis into the tools you already run.",
    },
  ],
};
