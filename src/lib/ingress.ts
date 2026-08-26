export type IngressChannel = 'https' | 'smtp';
export type InboundTransport = 'https' | 'smtp' | 'both';

export function normalizeInboundTransport(
  value: unknown,
): InboundTransport {
  if (value === 'smtp' || value === 'both' || value === 'https') {
    return value;
  }
  return 'https';
}

export function ingressAllows(
  tenant: { inbound_transport?: InboundTransport | string },
  channel: IngressChannel,
): boolean {
  const mode = normalizeInboundTransport(tenant.inbound_transport);
  if (mode === 'both') return true;
  return mode === channel;
}

export function ingressBlockedMessage(channel: IngressChannel): string {
  if (channel === 'https') {
    return 'HTTPS ingress is disabled for this tenant. Submit mail over SMTP.';
  }
  return 'SMTP ingress is disabled for this tenant. Submit mail over HTTPS.';
}
