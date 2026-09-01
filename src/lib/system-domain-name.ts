import { isPublicTlsHostname, parseTlsHostname } from '@/lib/smtp-tls';

export const DEFAULT_PLATFORM_LOCAL_PART = 'noreply';

export type SuggestedSystemDomain = {
  domain: string;
  source: 'nextauth' | 'origin' | '';
  isPublic: boolean;
};

export function hostnameFromPublicUrl(value: string | undefined): string {
  const raw = (value || '').trim();
  if (!raw) return '';
  try {
    if (/^https?:\/\//i.test(raw)) {
      return parseTlsHostname(new URL(raw).hostname);
    }
  } catch {
    return '';
  }
  return parseTlsHostname(raw);
}

export function suggestedSystemDomain(input: {
  nextAuthUrl?: string;
  requestOrigin?: string;
} = {}): SuggestedSystemDomain {
  const fromAuth = hostnameFromPublicUrl(
    input.nextAuthUrl ?? process.env.NEXTAUTH_URL,
  );
  if (fromAuth) {
    return {
      domain: fromAuth,
      source: 'nextauth',
      isPublic: isPublicTlsHostname(fromAuth),
    };
  }
  const fromOrigin = hostnameFromPublicUrl(input.requestOrigin);
  if (fromOrigin) {
    return {
      domain: fromOrigin,
      source: 'origin',
      isPublic: isPublicTlsHostname(fromOrigin),
    };
  }
  return { domain: '', source: '', isPublic: false };
}

export function normalizeLocalPart(value: string): string {
  return value.trim().toLowerCase().replace(/@.*$/, '');
}

export function platformFromOnDomain(
  localPart: string,
  domain: string,
): string {
  const local = normalizeLocalPart(localPart) || DEFAULT_PLATFORM_LOCAL_PART;
  return `${local}@${domain}`;
}

export function localPartFromEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf('@');
  if (at <= 0) return DEFAULT_PLATFORM_LOCAL_PART;
  return trimmed.slice(0, at);
}

export function emailDomain(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf('@');
  if (at < 0) return '';
  return trimmed.slice(at + 1);
}

export function assertEmailOnDomain(email: string, domain: string): void {
  const host = emailDomain(email);
  if (host !== domain.toLowerCase()) {
    throw new Error(`From address must use the system domain ${domain}`);
  }
}
