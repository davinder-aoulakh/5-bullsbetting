import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const {
      user_email,
      user_name,
      verification_type,
      provider,
      reference_id,
      status,
      result_details
    } = body;

    console.log('📝 Creating verification log:', {
      user_email,
      user_name,
      verification_type,
      provider,
      status
    });

    // Create log entry (no user_id required - we'll use a placeholder)
    const log = await base44.asServiceRole.entities.VerificationLog.create({
      user_id: user_email || 'unknown',
      user_email: user_email || null,
      user_name: user_name || null,
      verification_type,
      provider,
      reference_id: reference_id || null,
      status,
      result_details: result_details || {
        message: null,
        confidence_score: null,
        flags: []
      }
    });

    console.log('✅ Verification log created:', log.id);

    return Response.json({ success: true, logId: log.id });

  } catch (error) {
    console.error('❌ Error creating verification log:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});