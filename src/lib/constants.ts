// Devices below either threshold get the low-power (non-3D) experience.
export const LOW_POWER_LIMITS = {
  minCpuCores: 4,
  minMemoryGb: 4,
} as const;
