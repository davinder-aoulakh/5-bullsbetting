import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // No auth required - this is during onboarding
    const body = await req.json();
    const { userData } = body;

    if (!userData) {
      return Response.json({ 
        error: 'userData is required' 
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    
    // Create a session in the database
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    console.log('📝 Creating SDK verification session:', sessionId);
    const newSession = await base44.asServiceRole.entities.VerificationSession.create({
      session_id: sessionId,
      user_data: userData,
      status: 'pending',
      verification_mode: 'sdk',
      expires_at: expiresAt.toISOString()
    });

    console.log('✅ Created SDK verification session:', sessionId, 'DB ID:', newSession.id);

    return Response.json({
      sessionId,
      mobileUrl: `${req.headers.get('origin')}/Onboarding?sdkSession=${sessionId}`,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});