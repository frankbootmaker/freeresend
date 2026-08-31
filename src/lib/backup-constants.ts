export const SCHEDULE_INTERVAL_PRESETS = [
  3600,
  21600,
  43200,
  86400,
  604800,
] as const;

export type ScheduleIntervalPreset = (typeof SCHEDULE_INTERVAL_PRESETS)[number];
