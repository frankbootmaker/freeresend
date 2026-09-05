import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { applySesReputationEvent } from '@/lib/sending-breaker';
import { recordSesSuppressions } from '@/lib/suppression';
import {
  confirmSnsSubscription,
  messageIdLookupValues,
  parseSesWebhookBody,
  type SesEventKind,
  type SesEventPayload,
} from '@/lib/ses-events';

async function findEmailLog(messageId: string | null) {
  const ids = messageIdLookupValues(messageId);
  if (ids.length === 0) return null;
  const result = await query(
    `SELECT * FROM email_logs
     WHERE ses_message_id = ANY($1::text[])
     LIMIT 1`,
    [ids],
  );
  return result.rows[0] || null;
}

function statusFromEvent(eventType: SesEventKind, payload: SesEventPayload) {
  if (eventType === 'delivery') {
    return { status: 'delivered', errorMessage: null as string | null };
  }
  if (eventType === 'bounce') {
    return {
      status: 'bounced',
      errorMessage: (payload.bounce?.bouncedRecipients || [])
        .map((row) => `${row.emailAddress || ''}: ${row.diagnosticCode || ''}`)
        .join('; ') || 'Bounced',
    };
  }
  if (eventType === 'complaint') {
    return {
      status: 'complained',
      errorMessage: `Complaint from: ${(payload.complaint?.complainedRecipients || [])
        .map((row) => row.emailAddress)
        .filter(Boolean)
        .join(', ')}`,
    };
  }
  if (eventType === 'reject') {
    return { status: 'failed', errorMessage: 'Email rejected by SES' };
  }
  return null;
}

async function processSesEvent(
  eventType: SesEventKind,
  messageId: string | null,
  payload: SesEventPayload,
) {
  try {
    const row = await findEmailLog(messageId);
    if (!row) {
      console.warn(`Email log not found for message ID: ${messageId || '(missing)'}`);
      return;
    }

    const next = statusFromEvent(eventType, payload);
    if (next) {
      await query(
        `UPDATE email_logs
         SET status = $1, error_message = $2, webhook_data = $3
         WHERE id = $4`,
        [next.status, next.errorMessage, JSON.stringify(payload), row.id],
      );
    }

    await query(
      `INSERT INTO webhook_events (email_log_id, event_type, event_data, processed)
       VALUES ($1, $2, $3, $4)`,
      [row.id, eventType, JSON.stringify(payload), true],
    );

    await recordSesSuppressions({
      tenantId: row.tenant_id,
      emailLogId: row.id,
      event: payload,
    });

    if (eventType === 'bounce' || eventType === 'complaint') {
      await applySesReputationEvent(row.tenant_id);
    }

    console.log(`Processed ${eventType} event for email ${row.id}`);
  } catch (error) {
    console.error('Failed to process SES event:', error);
    try {
      await query(
        `INSERT INTO webhook_events (email_log_id, event_type, event_data, processed)
         VALUES ($1, $2, $3, $4)`,
        [null, eventType, JSON.stringify(payload), false],
      );
    } catch (insertError) {
      console.error('Failed to create webhook event record:', insertError);
    }
  }
}

async function handleSESWebhook(req: NextRequest) {
  try {
    const parsed = parseSesWebhookBody(await req.json());

    if (parsed.kind === 'subscription') {
      const confirmed = await confirmSnsSubscription(parsed.subscribeUrl);
      console.log(
        confirmed
          ? 'SNS subscription confirmed'
          : 'SNS subscription confirmation failed',
      );
      return NextResponse.json({
        message: confirmed ? 'Subscription confirmed' : 'Subscription confirmation failed',
      }, { status: confirmed ? 200 : 502 });
    }

    if (parsed.kind === 'event') {
      await processSesEvent(parsed.eventType, parsed.messageId, parsed.payload);
      return NextResponse.json({ message: 'Event processed' });
    }

    return NextResponse.json({ message: 'Unknown event type' });
  } catch (error) {
    console.error('SES webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

function cors(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 200 }));
}

export async function POST(request: NextRequest) {
  try {
    return cors(await handleSESWebhook(request));
  } catch (error) {
    console.error('API Error:', error);
    return cors(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    ));
  }
}
