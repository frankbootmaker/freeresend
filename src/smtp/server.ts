import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { loadEnvConfig } from '@next/env';
import { verifyApiKey } from '../lib/api-keys';
import { dispatchWithApiKey, SendDispatchError } from '../lib/send-email';
import type { ApiKey } from '../lib/database';

loadEnvConfig(process.cwd());

const listenPort = Number(process.env.SMTP_LISTEN_PORT || 2525);
const listenHost = process.env.SMTP_LISTEN_HOST || '0.0.0.0';

function addressesOf(field: unknown): string[] {
  if (!field) return [];
  const list = Array.isArray(field) ? field : [field];
  return list.flatMap((item) => {
    const value = (item as { value?: Array<{ address?: string }> }).value || [];
    return value
      .map((entry) => entry.address)
      .filter((value): value is string => Boolean(value));
  });
}

function resolveApiKey(username?: string, password?: string): string | null {
  if (password?.startsWith('frs_')) return password;
  if (username?.startsWith('frs_')) return username;
  return null;
}

async function authenticate(
  username: string | undefined,
  password: string | undefined,
): Promise<ApiKey> {
  const raw = resolveApiKey(username, password);
  if (!raw) {
    throw new Error('SMTP password must be a RelayHorizon API key (frs_…)');
  }
  const apiKey = await verifyApiKey(raw);
  if (!apiKey) {
    throw new Error('Invalid SMTP credentials');
  }
  return apiKey;
}

const server = new SMTPServer({
  name: 'outpost',
  banner: 'RelayHorizon SMTP submission',
  authOptional: false,
  allowInsecureAuth: true,
  disabledCommands: ['STARTTLS'],
  size: 10 * 1024 * 1024,
  onAuth(auth, _session, callback) {
    authenticate(auth.username, auth.password)
      .then((apiKey) => callback(null, { user: apiKey }))
      .catch((error: Error) => callback(error));
  },
  onData(stream, session, callback) {
    const apiKey = session.user as ApiKey | undefined;
    if (!apiKey) {
      callback(new Error('Not authenticated'));
      return;
    }

    simpleParser(stream)
      .then(async (mail) => {
        const from = mail.from?.value?.[0]?.address;
        const to = addressesOf(mail.to);
        if (!from || to.length === 0) {
          throw new SendDispatchError('From and To addresses are required', 400);
        }
        const subject = mail.subject || '(no subject)';
        const html = typeof mail.html === 'string' ? mail.html : undefined;
        const text = mail.text;
        if (!html && !text) {
          throw new SendDispatchError('Message body is required', 400);
        }
        await dispatchWithApiKey(
          apiKey,
          {
            from,
            to,
            cc: addressesOf(mail.cc),
            bcc: addressesOf(mail.bcc),
            subject,
            html,
            text,
            replyTo: addressesOf(mail.replyTo),
          },
          'smtp',
        );
        callback();
      })
      .catch((error: unknown) => {
        const err = error as Error & { status?: number };
        callback(err);
      });
  },
});

server.on('error', (error) => {
  console.error('SMTP server error:', error);
});

server.listen(listenPort, listenHost, () => {
  console.log(`RelayHorizon SMTP submission listening on ${listenHost}:${listenPort}`);
});
