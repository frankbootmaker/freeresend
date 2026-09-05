/**
 * @jest-environment node
 */

import {
  confirmSnsSubscription,
  isAllowedSnsSubscribeUrl,
  messageIdLookupValues,
  normalizeSesEventType,
  normalizeSesMessageId,
  parseSesWebhookBody,
  sesEventKindFromPayload,
} from '../ses-events';

describe('ses-events', () => {
  it('normalizes AWS PascalCase and notificationType', () => {
    expect(normalizeSesEventType('Delivery')).toBe('delivery');
    expect(normalizeSesEventType('Bounce')).toBe('bounce');
    expect(sesEventKindFromPayload({ notificationType: 'Complaint' })).toBe(
      'complaint',
    );
    expect(normalizeSesEventType('Rendering Failure')).toBeNull();
  });

  it('unwraps SNS notifications and direct HTTPS events', () => {
    expect(
      parseSesWebhookBody({
        Type: 'Notification',
        Message: JSON.stringify({
          eventType: 'Delivery',
          mail: { messageId: '<abc-123@email.amazonses.com>' },
        }),
      }),
    ).toEqual({
      kind: 'event',
      eventType: 'delivery',
      messageId: 'abc-123@email.amazonses.com',
      payload: {
        eventType: 'Delivery',
        mail: { messageId: '<abc-123@email.amazonses.com>' },
      },
    });

    expect(
      parseSesWebhookBody({
        notificationType: 'Delivery',
        mail: { messageId: 'mid-1' },
      }),
    ).toMatchObject({ kind: 'event', eventType: 'delivery', messageId: 'mid-1' });
  });

  it('accepts only HTTPS SNS subscribe URLs', () => {
    expect(
      isAllowedSnsSubscribeUrl(
        'https://sns.eu-central-1.amazonaws.com/?Action=ConfirmSubscription',
      ),
    ).toBe(true);
    expect(
      isAllowedSnsSubscribeUrl('https://evil.example/?Action=ConfirmSubscription'),
    ).toBe(false);
    expect(
      parseSesWebhookBody({
        Type: 'SubscriptionConfirmation',
        SubscribeURL:
          'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&Token=1',
      }),
    ).toEqual({
      kind: 'subscription',
      subscribeUrl:
        'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&Token=1',
    });
  });

  it('looks up SES and SMTP-style message ids', () => {
    expect(normalizeSesMessageId('<abc@host>')).toBe('abc@host');
    expect(messageIdLookupValues('<abc@host>')).toEqual([
      'abc@host',
      '<abc@host>',
    ]);
  });

  it('refuses to confirm a non-SNS URL', async () => {
    await expect(
      confirmSnsSubscription('https://example.com/confirm'),
    ).resolves.toBe(false);
  });
});
