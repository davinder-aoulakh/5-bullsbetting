import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { mapStatus, buildFailureReason, logStatusToVerificationLogStatus } from '../../shared/didit-helpers.ts';

// Recursively sort object keys (deep), and truncate float trailing zeros
function sortKeysDeep(val: any): any {
  if (Array.isArray(val)) {
    return val.map(sortKeysDeep);
  }
  if (val !== null && typeof val === 'object') {
    return Object.keys(val)
      .sort()
      .reduce((acc: any, k) => {
        acc[k] = sortKeysDeep(val[k]);
        return acc;
      }, {});
  }
  if (typeof val === 'number' && !Number.isInteger(val)) {
    // Truncate trailing zeros from float representation
    return parseFloat(val.toPrecision(15));
  }
  return val;
}

function canonicalString(obj: any): string {
  return JSON.stringify(sortKeysDeep(obj));
}

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const parsed = JSON.parse(rawBody);
  const canonical = canonicalString(parsed);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonical));
  const computed = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time compare
  if (computed.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature-v2') || '';
    const secret = Deno.env.get('DIDIT_WEBHOOK_SECRET');

    if (!secret) {
      console.error('❌ [diditWebhook] DIDIT_WEBHOOK_SECRET not configured');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const valid = await verifySignature(rawBody, signature, secret);
    if (!valid) {
      console.warn('⚠️ [diditWebhook] Invalid signature — rejecting request');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { webhook_type, session_id, status: rawStatus, decision } = payload;

    console.log(`📨 [diditWebhook] Received webhook_type="${webhook_type}" session_id="${session_id}" raw_status="${rawStatus}"`);

    if (!session_id) {
      return Response.json({ received: true, warning: 'No session_id' }, { status: 200 });
    }

    const mappedStatus = mapStatus(rawStatus || '');
    console.log(`🔄 [diditWebhook] Mapped status: "${rawStatus}" -> "${mappedStatus}"`);

    const base44 = createClientFromRequest(req);
    const sessions = await base44.asServiceRole.entities.VerificationSession.filter({ session_id });
    const session = sessions?.[0];

    if (!session) {
      console.warn(`⚠️ [diditWebhook] No VerificationSession found for session_id="${session_id}"`);
      // Still 200 so Didit doesn't retry endlessly for unknown sessions
      return Response.json({ received: true, warning: 'Session not found' }, { status: 200 });
    }

    // Update VerificationSession
    const updatePayload: any = { status: mappedStatus, decision: decision ?? null };
    if (mappedStatus === 'declined') {
      updatePayload.failure_reason = buildFailureReason(decision);
    }
    await base44.asServiceRole.entities.VerificationSession.update(session.id, updatePayload);
    console.log(`✅ [diditWebhook] VerificationSession updated id="${session.id}" status="${mappedStatus}"`);

    // Create VerificationLog entry
    const logStatus = logStatusToVerificationLogStatus(mappedStatus);
    await base44.asServiceRole.entities.VerificationLog.create({
      user_id: session.linked_email || session_id,
      verification_type: 'id_document',
      provider: 'didit',
      reference_id: session.id,
      status: logStatus,
      result_details: { message: updatePayload.failure_reason || mappedStatus, ...(decision ? { decision } : {}) }
    });
    console.log(`📝 [diditWebhook] VerificationLog created for session="${session.id}" log_status="${logStatus}"`);

    return Response.json({ received: true, status: mappedStatus }, { status: 200 });

  } catch (error) {
    console.error('❌ [diditWebhook] Unexpected error:', error);
    // Return 200 to prevent Didit retries on unexpected errors after initial processing
    return Response.json({ received: true, error: error.message }, { status: 200 });
  }
});