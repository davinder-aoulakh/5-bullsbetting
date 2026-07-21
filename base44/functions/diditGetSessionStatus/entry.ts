import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const STATUS_MAP = {
  'not started': 'pending',
  'in progress': 'in_progress',
  'approved': 'approved',
  'declined': 'declined',
  'in review': 'in_review',
  'abandoned': 'abandoned',
  'expired': 'expired'
};

function buildFailureReason(decision) {
  const failed = [];

  const idv = decision?.kyc?.id_verification;
  if (idv && idv.status && idv.status.toLowerCase() !== 'approved') {
    if (idv.document_expired) {
      failed.push('the identity document is expired');
    } else {
      failed.push('document authenticity check failed');
    }
  }

  const liveness = decision?.kyc?.liveness;
  if (liveness && liveness.passed === false) {
    failed.push('liveness/selfie check failed');
  }

  const faceMatch = decision?.kyc?.face_match;
  if (faceMatch && faceMatch.passed === false) {
    failed.push('face match check failed');
  }

  const ageVerification = decision?.kyc?.age_verification;
  if (ageVerification && ageVerification.passed === false) {
    failed.push('age verification failed');
  }

  if (failed.length === 0) {
    return 'Verification was declined. Please contact support for more information.';
  }

  const list = failed.join(', ');
  return `Verification declined: ${list.charAt(0).toUpperCase() + list.slice(1)}.`;
}

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
      console.error('❌ [diditGetSessionStatus] Didit API error:', diditRes.status, errBody);
      return Response.json(
        { error: `Didit API error ${diditRes.status}`, details: errBody },
        { status: diditRes.status }
      );
    }

    const decision = await diditRes.json();
    console.log('✅ [diditGetSessionStatus] Decision received:', JSON.stringify(decision));

    const rawStatus = (decision?.status || '').toLowerCase();
    const mappedStatus = STATUS_MAP[rawStatus] ?? 'pending';

    // Look up our VerificationSession record
    const base44 = createClientFromRequest(req);
    const sessions = await base44.asServiceRole.entities.VerificationSession.filter({ session_id: sessionId });
    const session = sessions?.[0];

    if (session && session.status !== mappedStatus) {
      const updatePayload = {
        status: mappedStatus,
        decision
      };

      if (mappedStatus === 'declined') {
        updatePayload.failure_reason = buildFailureReason(decision);
      }

      console.log('📝 [diditGetSessionStatus] Updating session record:', session.id, updatePayload);
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