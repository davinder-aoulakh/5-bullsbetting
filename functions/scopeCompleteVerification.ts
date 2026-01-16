import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { userData, sessionId } = body;

    if (!userData) {
      return Response.json({ error: 'userData is required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    console.log('🚀 Starting Scope CDD verification for:', userData.full_name);

    // Step 1: Search for existing person
    console.log('🔍 Step 1: Searching for existing person...');
    const searchResponse = await base44.asServiceRole.functions.invoke('scopeSearchPerson', {
      userData
    });

    let personId = null;
    let person = null;

    if (searchResponse.data.found) {
      console.log('✅ Person found in Scope');
      person = searchResponse.data.person;
      personId = person.id;
    } else {
      // Step 2: Create new person and initiate screening
      console.log('➕ Step 2: Creating new person in Scope...');
      const createResponse = await base44.asServiceRole.functions.invoke('scopeCreatePerson', {
        userData
      });

      if (createResponse.data.error) {
        throw new Error(createResponse.data.error);
      }

      personId = createResponse.data.person_id;
      person = createResponse.data.person;
      console.log('✅ Person created with ID:', personId);
    }

    // Step 3: Get screening results (with polling)
    console.log('📊 Step 3: Getting screening results...');
    const detailsResponse = await base44.asServiceRole.functions.invoke('scopeGetPersonDetails', {
      personId,
      maxPolls: 30,
      pollInterval: 2000
    });

    if (detailsResponse.data.error) {
      // Check if it's a timeout (202 status)
      if (detailsResponse.status === 202) {
        console.warn('⏰ Screening still in progress');
        return Response.json({
          status: 'pending',
          person_id: personId,
          message: 'Screening is still in progress. Please check back later.'
        }, { status: 202 });
      }
      throw new Error(detailsResponse.data.error);
    }

    const { person: finalPerson, evaluation } = detailsResponse.data;

    console.log('✅ Screening complete:', evaluation.status);

    // Step 4: Save verification results to database
    const verificationRecord = {
      user_id: sessionId || userData.email, // Use session ID or email as temporary identifier
      person_id: personId,
      status: evaluation.status,
      risk_score: evaluation.risk_score,
      sanctions_hit: finalPerson.screening?.sanctions?.hit || false,
      pep_hit: finalPerson.screening?.pep?.hit || false,
      adverse_media_hit: finalPerson.screening?.adverse_media?.hit || false,
      rejection_reason: evaluation.reason,
      scope_response: finalPerson,
      screening_date: new Date().toISOString()
    };

    const savedVerification = await base44.asServiceRole.entities.ScopeVerification.create(verificationRecord);
    console.log('💾 Verification saved:', savedVerification.id);

    // Return result
    return Response.json({
      status: evaluation.status,
      approved: evaluation.approved,
      person_id: personId,
      reason: evaluation.reason,
      risk_score: evaluation.risk_score,
      verification_id: savedVerification.id,
      details: {
        sanctions: finalPerson.screening?.sanctions,
        pep: finalPerson.screening?.pep,
        adverse_media: finalPerson.screening?.adverse_media
      }
    });

  } catch (error) {
    console.error('❌ Error in Scope verification:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});