/**
 * @jest-environment node
 */

import {
  collectRecipientEmails,
  extractRecipientEmail,
  shouldSuppressBounce,
  suppressionActionsFromSesEvent,
} from '../suppression';

describe('recipient normalization', () => {
  it('extracts and lowercases addresses', () => {
    expect(extractRecipientEmail('Mara <Mara@Company.TEST>')).toBe(
      'mara@company.test',
    );
    expect(
      collectRecipientEmails({
        to: ['Ada <ada@relay.test>'],
        cc: ['ada@relay.test', 'ops@relay.test'],
        bcc: ['bad'],
      }),
    ).toEqual(['ada@relay.test', 'ops@relay.test']);
  });
});

describe('suppressionActionsFromSesEvent', () => {
  it('suppresses permanent bounces and complaints only', () => {
    expect(shouldSuppressBounce('Transient')).toBe(false);
    expect(shouldSuppressBounce('Permanent')).toBe(true);
    expect(
      suppressionActionsFromSesEvent({
        eventType: 'bounce',
        bounce: {
          bounceType: 'Transient',
          bouncedRecipients: [{ emailAddress: 'soft@relay.test' }],
        },
      }),
    ).toEqual([]);
    expect(
      suppressionActionsFromSesEvent({
        eventType: 'bounce',
        bounce: {
          bounceType: 'Permanent',
          bouncedRecipients: [{ emailAddress: 'Hard@Relay.TEST' }],
        },
      }),
    ).toEqual([
      {
        email: 'hard@relay.test',
        reason: 'bounce',
        bounceType: 'Permanent',
      },
    ]);
    expect(
      suppressionActionsFromSesEvent({
        eventType: 'complaint',
        complaint: {
          complainedRecipients: [{ emailAddress: 'user@relay.test' }],
        },
      }),
    ).toEqual([{ email: 'user@relay.test', reason: 'complaint' }]);
    expect(
      suppressionActionsFromSesEvent({
        eventType: 'Bounce',
        bounce: {
          bounceType: 'Permanent',
          bouncedRecipients: [{ emailAddress: 'aws@relay.test' }],
        },
      }),
    ).toEqual([
      {
        email: 'aws@relay.test',
        reason: 'bounce',
        bounceType: 'Permanent',
      },
    ]);
  });
});
