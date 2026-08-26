import { ingressAllows, ingressBlockedMessage } from '../ingress';

describe('tenant ingress', () => {
  it('allows HTTPS by default', () => {
    expect(ingressAllows({ inbound_transport: 'https' }, 'https')).toBe(true);
    expect(ingressAllows({ inbound_transport: 'https' }, 'smtp')).toBe(false);
    expect(ingressAllows({ inbound_transport: undefined }, 'https')).toBe(true);
  });

  it('allows SMTP only when selected', () => {
    expect(ingressAllows({ inbound_transport: 'smtp' }, 'smtp')).toBe(true);
    expect(ingressAllows({ inbound_transport: 'smtp' }, 'https')).toBe(false);
    expect(ingressAllows({ inbound_transport: 'both' }, 'smtp')).toBe(true);
    expect(ingressAllows({ inbound_transport: 'both' }, 'https')).toBe(true);
  });

  it('explains which channel is closed', () => {
    expect(ingressBlockedMessage('https')).toMatch(/SMTP/);
    expect(ingressBlockedMessage('smtp')).toMatch(/HTTPS/);
  });
});
