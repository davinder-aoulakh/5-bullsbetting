import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { sessionId, status, result } = body;

    if (!sessionId || !status) {
      return Response.json({ 
        error: 'sessionId and status are required' 
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    
    // Get session
    const sessions = await base44.asServiceRole.entities.VerificationSession.filter({
      session_id: sessionId
    });

    if (!sessions || sessions.length === 0) {
      return Response.json({ 
        error: 'Session not found' 
      }, { status: 404 });
    }

    const session = sessions[0];

    // Update session
    const updateData = { status };
    if (result) {
      updateData.result = result;
    }

    await base44.asServiceRole.entities.VerificationSession.update(session.id, updateData);

    console.log('✅ Updated SDK verification session:', sessionId, 'status:', status);

    return Response.json({ success: true });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});