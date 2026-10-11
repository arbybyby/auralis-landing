export interface Metric {
  label: string;
  value: string;
  unit?: string;
  trend: string;
}

export interface LiveDataContent {
  title: string;
  liveLabel: string;
  metrics: Metric[];
}

export const liveData: LiveDataContent = {
  title: "The planet, in real time",
  liveLabel: "Live",
  metrics: [
    {
      label: "Sea surface temperature",
      value: "17.4",
      unit: "°C",
      trend: "+0.3 vs. last week",
    },
    { label: "Active wildfires detected", value: "1,284", trend: "−6%" },
    { label: "Vessels tracked", value: "58,902", trend: "+2%" },
    { label: "Forecast confidence", value: "97.8", unit: "%", trend: "stable" },
  ],
};
