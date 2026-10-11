import type { TitledItem } from "@/content/types";

export interface Beat extends TitledItem {
  isSolution: boolean;
}

export const problemSolution: Beat[] = [
  {
    title: "Fragmented",
    text: "Satellites, ground sensors and climate models all speak different languages. Teams stitch them together by hand.",
    isSolution: false,
  },
  {
    title: "Late",
    text: "By the time a report is ready, the situation it describes has already changed.",
    isSolution: false,
  },
  {
    title: "Auralis",
    text: "One living model. Every signal aligned in space and time, updated in under half a second.",
    isSolution: true,
  },
];
