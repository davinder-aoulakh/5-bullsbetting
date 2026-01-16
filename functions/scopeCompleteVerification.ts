import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    console.log('🚀 [scopeCompleteVerification] Function invoked');
    
    const body = await req.json();
    console.log('📥 [scopeCompleteVerification] Request body:', JSON.stringify(body, null, 2));
    
    const { userData, sessionId } = body;

    if (!userData) {
      console.error('❌ [scopeCompleteVerification] userData is missing');
      return Response.json({ error: 'userData is required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    console.log('🚀 [scopeCompleteVerification] Starting Scope CDD verification');
    console.log('👤 [scopeCompleteVerification] User:', {
      name: userData.full_name,
      dob: userData.date_of_birth,
      country: userData.country,
      idType: userData.id_type
    });

    // Step 1: Search for existing person
    console.log('🔍 [scopeCompleteVerification] Step 1: Searching for existing person...');
    const searchResponse = await base44.asServiceRole.functions.invoke('scopeSearchPerson', {
      userData
    });

    console.log('📊 [scopeCompleteVerification] Search response:', JSON.stringify(searchResponse.data, null, 2));

    let personId = null;
    let person = null;

    if (searchResponse.data.found) {
      console.log('✅ [scopeCompleteVerification] Person found in Scope');
      person = searchResponse.data.person;
      personId = person.id;
      console.log('🆔 [scopeCompleteVerification] Existing person ID:', personId);
    } else {
      // Step 2: Create new person and initiate screening
      console.log('➕ [scopeCompleteVerification] Step 2: Creating new person in Scope...');
      const createResponse = await base44.asServiceRole.functions.invoke('scopeCreatePerson', {
        userData
      });

      console.log('📊 [scopeCompleteVerification] Create response:', JSON.stringify(createResponse.data, null, 2));

      if (createResponse.data.error) {
        console.error('❌ [scopeCompleteVerification] Create failed:', createResponse.data.error);
        throw new Error(createResponse.data.error);
      }

      personId = createResponse.data.person_id;
      person = createResponse.data.person;
      console.log('✅ [scopeCompleteVerification] Person created with ID:', personId);
    }

    // Step 3: Get screening results (with polling)
    console.log('📊 [scopeCompleteVerification] Step 3: Getting screening results...');
    const detailsResponse = await base44.asServiceRole.functions.invoke('scopeGetPersonDetails', {
      personId,
      maxPolls: 30,
      pollInterval: 2000
    });

    console.log('📊 [scopeCompleteVerification] Details response:', JSON.stringify(detailsResponse.data, null, 2));

    if (detailsResponse.data.error) {
      // Check if it's a timeout (202 status)
      if (detailsResponse.status === 202) {
        console.warn('⏰ [scopeCompleteVerification] Screening still in progress');
        return Response.json({
          status: 'pending',
          person_id: personId,
          message: 'Screening is still in progress. Please check back later.'
        }, { status: 202 });
      }
      console.error('❌ [scopeCompleteVerification] Details failed:', detailsResponse.data.error);
      throw new Error(detailsResponse.data.error);
    }

    const { person: finalPerson, evaluation } = detailsResponse.data;

    console.log('✅ [scopeCompleteVerification] Screening complete:', evaluation.status);
    console.log('📊 [scopeCompleteVerification] Evaluation details:', JSON.stringify(evaluation, null, 2));

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

    console.log('💾 [scopeCompleteVerification] Saving verification record:', JSON.stringify(verificationRecord, null, 2));

    const savedVerification = await base44.asServiceRole.entities.ScopeVerification.create(verificationRecord);
    console.log('✅ [scopeCompleteVerification] Verification saved with ID:', savedVerification.id);

    const result = {
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
    };

    console.log('🎯 [scopeCompleteVerification] Final result:', JSON.stringify(result, null, 2));

    // Return result
    return Response.json(result);

  } catch (error) {
    console.error('❌ [scopeCompleteVerification] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});