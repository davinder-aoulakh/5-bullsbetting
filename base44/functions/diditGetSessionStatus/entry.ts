import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { mapStatus, buildFailureReason } from '../../shared/didit-helpers.ts';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return Response.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('DIDIT_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Didit credentials not configured' }, { status: 500 });
    }

    // Always fetch directly from Didit — never trust client-supplied status
    console.log('🔍 [diditGetSessionStatus] Fetching decision for session:', sessionId);
    const diditRes = await fetch(`https://verification.didit.me/v3/session/${sessionId}/decision/`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey }
    });

    if (!diditRes.ok) {
      const errBody = await diditRes.text();
      // 404 means Didit hasn't produced a decision yet (session still in progress) — treat as pending
      if (diditRes.status === 404) {
        console.log('ℹ️ [diditGetSessionStatus] Decision not ready yet (404) — returning pending');
        return Response.json({ status: 'pending', decision: null, failureReason: null });
      }
      console.error('❌ [diditGetSessionStatus] Didit API error:', diditRes.status, errBody);
      return Response.json(
        { error: `Didit API error ${diditRes.status}`, details: errBody },
        { status: diditRes.status }
      );
    }

    const decision = await diditRes.json();
    const rawStatus = (decision?.status || '');
    const mappedStatus = mapStatus(rawStatus);

    // Look up our VerificationSession record
    const base44 = createClientFromRequest(req);
    const sessions = await base44.asServiceRole.entities.VerificationSession.filter({ session_id: sessionId });
    const session = sessions?.[0];

    if (session && session.status !== mappedStatus) {
      const updatePayload: any = { status: mappedStatus, decision };
      if (mappedStatus === 'declined') {
        updatePayload.failure_reason = buildFailureReason(decision);
      }
      console.log('📝 [diditGetSessionStatus] Updating session record:', session.id);
      await base44.asServiceRole.entities.VerificationSession.update(session.id, updatePayload);
    }

    const failureReason = mappedStatus === 'declined'
      ? (session?.failure_reason || buildFailureReason(decision))
      : null;

    return Response.json({ status: mappedStatus, decision, failureReason });

  } catch (error) {
    console.error('❌ [diditGetSessionStatus] Unexpected error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});