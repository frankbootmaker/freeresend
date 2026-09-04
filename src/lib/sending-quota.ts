export const DEFAULT_HOURLY_EMAIL_QUOTA = 5000;
export const DEFAULT_DAILY_EMAIL_QUOTA = 20000;
export const DEFAULT_MONTHLY_EMAIL_QUOTA = 100000;

export type SendWindowCounts = {
  hour: number;
  day: number;
  month: number;
};

export type SendWindowCaps = {
  hourly: number;
  daily: number;
  monthly: number;
};

export function quotaRejection(
  used: SendWindowCounts,
  caps: SendWindowCaps,
): string | null {
  if (used.hour >= caps.hourly) {
    return 'Hourly email quota exceeded';
  }
  if (used.day >= caps.daily) {
    return 'Daily email quota exceeded';
  }
  if (used.month >= caps.monthly) {
    return 'Monthly email quota exceeded';
  }
  return null;
}

export function capsFromTenant(tenant: {
  hourly_email_quota?: number | null;
  daily_email_quota?: number | null;
  monthly_email_quota?: number | null;
}): SendWindowCaps {
  return {
    hourly: Number(tenant.hourly_email_quota ?? DEFAULT_HOURLY_EMAIL_QUOTA),
    daily: Number(tenant.daily_email_quota ?? DEFAULT_DAILY_EMAIL_QUOTA),
    monthly: Number(tenant.monthly_email_quota ?? DEFAULT_MONTHLY_EMAIL_QUOTA),
  };
}
