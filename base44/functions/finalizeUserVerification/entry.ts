import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Find the most recent approved VerificationSession for this user's email within 24h
    const approvedSessions = await base44.asServiceRole.entities.VerificationSession.filter({
      linked_email: user.email,
      status: 'approved',
      created_date: { $gte: cutoff }
    }, '-created_date', 1);

    if (approvedSessions && approvedSessions.length > 0) {
      const session = approvedSessions[0];

      // Update user's kyc_status to approved
      await base44.asServiceRole.entities.User.update(user.id, { kyc_status: 'approved' });

      // Link the session to the real user id
      await base44.asServiceRole.entities.VerificationSession.update(session.id, { user_id: user.id });

      return Response.json({ verified: true, kycStatus: 'approved' });
    }

    // Check for a declined or in_review session to set a more specific status
    const declinedSessions = await base44.asServiceRole.entities.VerificationSession.filter({
      linked_email: user.email,
      status: { $in: ['declined', 'in_review'] },
      created_date: { $gte: cutoff }
    }, '-created_date', 1);

    const kycStatus = (declinedSessions && declinedSessions.length > 0)
      ? (declinedSessions[0].status === 'in_review' ? 'in_review' : 'declined')
      : 'unverified';

    await base44.asServiceRole.entities.User.update(user.id, { kyc_status: kycStatus });

    return Response.json({ verified: false, kycStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});