import type { TitledItem } from "@/content/types";

export interface UseCasesContent {
  title: string;
  items: TitledItem[];
}

export const useCases: UseCasesContent = {
  title: "One model, every industry",
  items: [
    {
      title: "Climate",
      text: "Track emissions, ice and extreme weather with continuous global coverage.",
    },
    {
      title: "Logistics",
      text: "Reroute fleets around disruptions before they hit the schedule.",
    },
    {
      title: "Energy",
      text: "Balance grids with solar, wind and demand forecasts at city scale.",
    },
    {
      title: "Agriculture",
      text: "Predict yield and water stress field by field.",
    },
  ],
};
