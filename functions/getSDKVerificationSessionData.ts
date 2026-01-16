import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return Response.json({ 
        error: 'sessionId is required' 
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    
    console.log('📥 Getting full session data for:', sessionId);
    
    // Get session from database with service role (no auth required during onboarding)
    const sessions = await base44.asServiceRole.entities.VerificationSession.filter({
      session_id: sessionId
    });

    if (!sessions || sessions.length === 0) {
      console.warn('❌ Session not found:', sessionId);
      return Response.json({ 
        error: 'Session not found' 
      }, { status: 404 });
    }

    const session = sessions[0];
    console.log('✅ Found session data:', sessionId);

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      return Response.json({ 
        error: 'Session expired' 
      }, { status: 410 });
    }

    return Response.json({
      session_id: session.session_id,
      status: session.status,
      user_data: session.user_data,
      verification_mode: session.verification_mode,
      expires_at: session.expires_at
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});