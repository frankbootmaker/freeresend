import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { dispatchTenantEmail, SendDispatchError } from '@/lib/send-email';

const attachmentSchema = z.object({
  filename: z.string(),
  content: z.string(),
  contentType: z.string().optional(),
});

const emailList = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : [value]))
  .pipe(z.array(z.string().min(1)).min(1));

const sendEmailSchema = z
  .object({
    from: z.string().min(1),
    to: emailList,
    cc: emailList.optional(),
    bcc: emailList.optional(),
    subject: z.string().min(1),
    html: z.string().optional(),
    text: z.string().optional(),
    attachments: z.array(attachmentSchema).optional(),
    reply_to: emailList.optional(),
    tags: z.record(z.string(), z.string()).optional(),
  })
  .refine((data) => data.html || data.text, {
    message: 'Either html or text content is required',
  });

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.apiKey) {
      return json({ error: 'API key required' }, 401);
    }

    const validatedData = sendEmailSchema.parse(await request.json());
    const sent = await dispatchTenantEmail({
      tenant: session.tenant,
      apiKey: session.apiKey,
      channel: 'https',
      payload: {
        from: validatedData.from,
        to: validatedData.to,
        cc: validatedData.cc,
        bcc: validatedData.bcc,
        subject: validatedData.subject,
        html: validatedData.html,
        text: validatedData.text,
        replyTo: validatedData.reply_to,
        tags: validatedData.tags,
        attachments: validatedData.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType || 'application/octet-stream',
        })),
      },
    });

    return json(sent);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    if (error instanceof SendDispatchError) {
      return json({ error: error.message }, error.status);
    }
    const errorObj = error as { errors?: unknown; message?: string };
    if (errorObj.errors) {
      return json(
        { error: 'Invalid request data', details: errorObj.errors },
        400,
      );
    }
    console.error('Send email error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}
