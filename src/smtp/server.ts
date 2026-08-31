import { SMTPServer, type SMTPServerOptions } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { loadEnvConfig } from '@next/env';
import { verifyApiKey } from '../lib/api-keys';
import { dispatchWithApiKey, SendDispatchError } from '../lib/send-email';
import { getResolvedPlatformSettings } from '../lib/platform-settings';
import {
  canListenOnPort,
  smtpTlsOptionsForPort,
  tlsMaterialFromPlatform,
} from '../lib/smtp-ingress';
import type { ApiKey } from '../lib/database';

loadEnvConfig(process.cwd());

const listenHost = process.env.SMTP_LISTEN_HOST || '0.0.0.0';
const reloadMs = Number(process.env.SMTP_RELOAD_MS || 15000);

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

function baseOptions(
  requireTls: boolean,
): Omit<
  SMTPServerOptions,
  'secure' | 'key' | 'cert' | 'disabledCommands' | 'allowInsecureAuth'
> {
  return {
    name: 'outpost',
    banner: 'RelayHorizon SMTP submission',
    authOptional: false,
    size: 10 * 1024 * 1024,
    onAuth(auth, session, callback) {
      if (requireTls && !session.secure) {
        callback(new Error('TLS is required before authentication'));
        return;
      }
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
            throw new SendDispatchError(
              'From and To addresses are required',
              400,
            );
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
  };
}

type Listener = { port: number; server: SMTPServer };

let listeners: Listener[] = [];
let lastFingerprint = '';

function closeListener(listener: Listener): Promise<void> {
  return new Promise((resolve) => {
    listener.server.close(() => resolve());
  });
}

async function stopAll(): Promise<void> {
  const current = listeners;
  listeners = [];
  await Promise.all(current.map(closeListener));
}

function listenOnPort(
  port: number,
  options: SMTPServerOptions,
): void {
  const server = new SMTPServer(options);
  server.on('error', (error) => {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'EACCES' || err.code === 'EADDRINUSE') {
      console.warn(`SMTP ${listenHost}:${port} unavailable: ${err.message}`);
      return;
    }
    console.error(`SMTP server error on ${port}:`, error);
  });
  server.listen(port, listenHost, () => {
    console.log(
      `RelayHorizon SMTP submission listening on ${listenHost}:${port}`,
    );
  });
  listeners.push({ port, server });
}

async function syncListeners(): Promise<void> {
  const settings = await getResolvedPlatformSettings();
  const tls = tlsMaterialFromPlatform(settings);
  const ports = settings.smtpListenPorts.filter((port) =>
    canListenOnPort(port, tls),
  );
  const fingerprint = [
    ports.join(','),
    settings.smtpIngressTlsMode,
    tls.fingerprint,
  ].join('|');
  if (fingerprint === lastFingerprint && listeners.length > 0) return;

  await stopAll();
  lastFingerprint = fingerprint;
  const requireTls = settings.smtpIngressTlsMode === 'required';
  for (const port of ports) {
    listenOnPort(port, {
      ...baseOptions(requireTls),
      ...smtpTlsOptionsForPort(port, settings.smtpIngressTlsMode, tls),
    });
  }
  if (ports.length === 0) {
    console.warn('SMTP ingress has no bindable ports (465 needs a certificate)');
  }
}

syncListeners().catch((error) => {
  console.error('SMTP ingress failed to start:', error);
});

setInterval(() => {
  syncListeners().catch((error) => {
    console.error('SMTP ingress reload failed:', error);
  });
}, Number.isFinite(reloadMs) ? Math.max(reloadMs, 5000) : 15000);
