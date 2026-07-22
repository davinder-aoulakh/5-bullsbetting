import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { fullName, email, dateOfBirth, country, idType, idValue, onboardingRef } = body;

    const apiKey = Deno.env.get('DIDIT_API_KEY');
    const workflowId = Deno.env.get('DIDIT_WORKFLOW_ID');

    if (!apiKey || !workflowId) {
      return Response.json({ error: 'Didit credentials not configured' }, { status: 500 });
    }

    const origin = req.headers.get('origin') || 'https://app.base44.com';
    const callbackUrl = `${origin}/Onboarding`;

    console.log('🚀 [diditCreateSession] Calling Didit API...');

    const diditRes = await fetch('https://verification.didit.me/v3/session/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        vendor_data: onboardingRef,
        callback: callbackUrl,
        callback_method: 'both',
        metadata: { full_name: fullName, email, country }
      })
    });

    if (!diditRes.ok) {
      const errBody = await diditRes.text();
      console.error('❌ [diditCreateSession] Didit API error:', diditRes.status, errBody);
      return Response.json(
        { error: `Didit API error ${diditRes.status}`, details: errBody },
        { status: diditRes.status }
      );
    }

    const diditData = await diditRes.json();
    console.log('✅ [diditCreateSession] Didit response:', JSON.stringify(diditData));

    const { session_id, session_token, url } = diditData;

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.VerificationSession.create({
      session_id,
      provider: 'didit',
      didit_session_token: session_token,
      verification_url: url,
      status: 'pending',
      verification_mode: 'link',
      user_data: { fullName, dateOfBirth, country, idType, idValue },
      linked_email: email,
      expires_at: expiresAt.toISOString()
    });

    console.log('📝 [diditCreateSession] VerificationSession created for session_id:', session_id);

    return Response.json({
      sessionId: session_id,
      verificationUrl: url,
      sessionToken: session_token,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('❌ [diditCreateSession] Unexpected error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});