// src/googleGmailApiHelpers.ts
import { gmail_v1 } from 'googleapis';
import { UserError } from 'fastmcp';

/**
 * Decode base64url-encoded data to a string.
 */
function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Recursively walk MIME part tree and extract text/plain and text/html bodies.
 */
export function decodeMessageBody(payload: gmail_v1.Schema$MessagePart): { text: string; html: string } {
  const result = { text: '', html: '' };

  if (!payload) return result;

  const mimeType = payload.mimeType || '';

  if (mimeType === 'text/plain' && payload.body?.data) {
    result.text = decodeBase64Url(payload.body.data);
    return result;
  }

  if (mimeType === 'text/html' && payload.body?.data) {
    result.html = decodeBase64Url(payload.body.data);
    return result;
  }

  if (mimeType.startsWith('multipart/') && payload.parts) {
    for (const part of payload.parts) {
      const sub = decodeMessageBody(part);
      if (sub.text) result.text += sub.text;
      if (sub.html) result.html += sub.html;
    }
  }

  return result;
}

/**
 * Extract specific headers from a message's payload.headers array.
 */
export function extractHeaders(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  names: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!headers) return result;

  const lowerNames = names.map(n => n.toLowerCase());
  for (const header of headers) {
    const lowerName = (header.name || '').toLowerCase();
    const idx = lowerNames.indexOf(lowerName);
    if (idx !== -1 && header.value) {
      result[names[idx]] = header.value;
    }
  }
  return result;
}

/**
 * Strip HTML tags and decode common entities to produce plain text.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Format a Gmail message into a structured object for tool responses.
 */
export function formatMessageForResponse(message: gmail_v1.Schema$Message): object {
  const headers = extractHeaders(message.payload?.headers, [
    'From', 'To', 'Cc', 'Subject', 'Date', 'Message-ID', 'In-Reply-To', 'References'
  ]);

  const body = decodeMessageBody(message.payload || {});
  const bodyText = body.text || (body.html ? stripHtml(body.html) : '');

  return {
    id: message.id,
    threadId: message.threadId,
    labelIds: message.labelIds || [],
    snippet: message.snippet || '',
    from: headers['From'] || '',
    to: headers['To'] || '',
    cc: headers['Cc'] || '',
    subject: headers['Subject'] || '(No subject)',
    date: headers['Date'] || '',
    messageId: headers['Message-ID'] || '',
    inReplyTo: headers['In-Reply-To'] || '',
    references: headers['References'] || '',
    body: bodyText,
  };
}

/**
 * Encode a header value as RFC 2047 =?UTF-8?B?...?= if it contains non-ASCII chars.
 */
export function encodeMimeHeader(value: string): string {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

/**
 * Build a raw RFC 2822 email message and return it base64url-encoded for the Gmail API.
 */
export function buildRfc2822Message(params: {
  to: string;
  subject: string;
  body: string;
  from?: string;
  cc?: string;
  bcc?: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const lines: string[] = [];

  if (params.from) lines.push(`From: ${encodeMimeHeader(params.from)}`);
  lines.push(`To: ${encodeMimeHeader(params.to)}`);
  if (params.cc) lines.push(`Cc: ${encodeMimeHeader(params.cc)}`);
  if (params.bcc) lines.push(`Bcc: ${encodeMimeHeader(params.bcc)}`);
  lines.push(`Subject: ${encodeMimeHeader(params.subject)}`);
  lines.push(`MIME-Version: 1.0`);
  lines.push(`Content-Type: text/plain; charset=UTF-8`);
  lines.push(`Content-Transfer-Encoding: quoted-printable`);
  if (params.inReplyTo) lines.push(`In-Reply-To: ${params.inReplyTo}`);
  if (params.references) lines.push(`References: ${params.references}`);
  lines.push('');
  lines.push(params.body);

  const raw = lines.join('\r\n');
  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Build a reply RFC 2822 message, inheriting thread headers from the original.
 */
export function buildReplyRfc2822Message(params: {
  originalMessage: gmail_v1.Schema$Message;
  body: string;
  from?: string;
  cc?: string;
}): string {
  const headers = extractHeaders(params.originalMessage.payload?.headers, [
    'From', 'Subject', 'Message-ID', 'References'
  ]);

  const originalSubject = headers['Subject'] || '';
  const subject = originalSubject.toLowerCase().startsWith('re:')
    ? originalSubject
    : `Re: ${originalSubject}`;

  const inReplyTo = headers['Message-ID'] || '';
  const existingRefs = headers['References'] || '';
  const references = existingRefs
    ? `${existingRefs} ${inReplyTo}`.trim()
    : inReplyTo;

  return buildRfc2822Message({
    to: headers['From'] || '',
    subject,
    body: params.body,
    from: params.from,
    cc: params.cc,
    inReplyTo,
    references,
  });
}

/**
 * Format a Gmail label into a structured object for tool responses.
 */
export function formatLabelForResponse(label: gmail_v1.Schema$Label): object {
  return {
    id: label.id,
    name: label.name,
    type: label.type,
    messagesTotal: label.messagesTotal,
    messagesUnread: label.messagesUnread,
  };
}

/**
 * Handle Gmail API errors, re-throwing UserError as-is and mapping HTTP codes.
 */
export function handleGmailError(error: any, operation: string): never {
  if (error instanceof UserError) throw error;
  const code = error.code ?? error.status;
  if (code === 404) throw new UserError(`Gmail resource not found. Check the message/thread ID.`);
  if (code === 403) throw new UserError(`Gmail permission denied: ${error.errors?.[0]?.message || error.message || 'Unknown reason'}`);
  if (code === 400) throw new UserError(`Gmail bad request for ${operation}: ${error.errors?.[0]?.message || error.message || 'Unknown reason'}`);
  throw new UserError(`Failed to ${operation}: ${error.message || 'Unknown error'}`);
}
