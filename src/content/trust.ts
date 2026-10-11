export interface Stat {
  value: string;
  label: string;
}

export interface TrustContent {
  label: string;
  partners: string[];
  stats: Stat[];
}

export const trust: TrustContent = {
  label: "Trusted by teams at",
  partners: [
    "Orbitline",
    "Helio Freight",
    "Northgrid",
    "Verdance",
    "Meridian Labs",
    "Kelvin & Co",
  ],
  stats: [
    { value: "12K", label: "satellites tracked" },
    { value: "0.4s", label: "global update latency" },
    { value: "98%", label: "7-day forecast accuracy" },
  ],
};
