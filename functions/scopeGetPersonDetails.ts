import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Compliance evaluation logic
function evaluateCompliance(personData) {
  const evaluation = {
    approved: false,
    status: 'pending',
    reason: null,
    risk_score: personData.risk_score || 0
  };

  // Check for sanctions hit (automatic rejection)
  if (personData.sanctions_hit || personData.screening?.sanctions?.hit) {
    evaluation.approved = false;
    evaluation.status = 'rejected';
    evaluation.reason = 'User is on sanctions list';
    return evaluation;
  }

  // Check for high-risk PEP (automatic rejection or manual review)
  if (personData.pep_hit || personData.screening?.pep?.hit) {
    const pepRisk = personData.screening?.pep?.risk_level || 'high';
    if (pepRisk === 'high') {
      evaluation.approved = false;
      evaluation.status = 'rejected';
      evaluation.reason = 'High-risk Politically Exposed Person (PEP)';
      return evaluation;
    } else {
      evaluation.approved = false;
      evaluation.status = 'manual_review';
      evaluation.reason = 'PEP detected - requires manual review';
      return evaluation;
    }
  }

  // Check risk score threshold
  const riskScore = personData.risk_score || 0;
  if (riskScore > 70) {
    evaluation.approved = false;
    evaluation.status = 'rejected';
    evaluation.reason = 'Risk score too high';
    return evaluation;
  } else if (riskScore > 50) {
    evaluation.approved = false;
    evaluation.status = 'manual_review';
    evaluation.reason = 'Moderate risk - requires manual review';
    return evaluation;
  }

  // Check adverse media
  if (personData.adverse_media_hit || personData.screening?.adverse_media?.hit) {
    const severity = personData.screening?.adverse_media?.severity || 'medium';
    if (severity === 'high') {
      evaluation.approved = false;
      evaluation.status = 'rejected';
      evaluation.reason = 'Serious adverse media findings';
      return evaluation;
    } else {
      evaluation.approved = false;
      evaluation.status = 'manual_review';
      evaluation.reason = 'Adverse media found - requires review';
      return evaluation;
    }
  }

  // All checks passed
  evaluation.approved = true;
  evaluation.status = 'approved';
  return evaluation;
}

Deno.serve(async (req) => {
  try {
    console.log('📊 [scopeGetPersonDetails] Function invoked');
    
    const body = await req.json();
    console.log('📥 [scopeGetPersonDetails] Request body:', JSON.stringify(body, null, 2));
    
    const { personId, maxPolls = 30, pollInterval = 2000 } = body;

    if (!personId) {
      console.error('❌ [scopeGetPersonDetails] personId is missing');
      return Response.json({ error: 'personId is required' }, { status: 400 });
    }

    const SCOPE_API_KEY = Deno.env.get('SCOPE_API_KEY');
    const SCOPE_API_URL = Deno.env.get('SCOPE_API_URL');

    console.log('🔑 [scopeGetPersonDetails] API Config:', {
      hasKey: !!SCOPE_API_KEY,
      keyLength: SCOPE_API_KEY?.length,
      url: SCOPE_API_URL
    });

    if (!SCOPE_API_KEY || !SCOPE_API_URL) {
      console.error('❌ [scopeGetPersonDetails] Missing Scope API credentials');
      return Response.json({ error: 'Scope API not configured' }, { status: 500 });
    }

    console.log('🔄 [scopeGetPersonDetails] Getting details for person:', personId);
    console.log('⏱️ [scopeGetPersonDetails] Poll config:', { maxPolls, pollInterval });

    // Poll for screening completion
    let attempts = 0;
    let screeningComplete = false;
    let personData = null;

    while (attempts < maxPolls && !screeningComplete) {
      attempts++;
      console.log(`📊 [scopeGetPersonDetails] Polling attempt ${attempts}/${maxPolls}`);

      const detailsResponse = await fetch(`${SCOPE_API_URL}/api/v4/GetPersonDetails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ person_id: personId })
      });

      console.log('📊 [scopeGetPersonDetails] Response status:', detailsResponse.status);

      if (!detailsResponse.ok) {
        const errorText = await detailsResponse.text();
        console.error('❌ [scopeGetPersonDetails] API Error:', {
          status: detailsResponse.status,
          statusText: detailsResponse.statusText,
          body: errorText,
          attempt: attempts
        });
        return Response.json({ 
          error: 'Failed to get person details from Scope',
          details: errorText,
          status: detailsResponse.status
        }, { status: detailsResponse.status });
      }

      const detailsData = await detailsResponse.json();
      personData = detailsData.data || detailsData;

      console.log(`📊 [scopeGetPersonDetails] Poll ${attempts} response:`, JSON.stringify(personData, null, 2));

      // Check if screening is complete
      const screeningStatus = personData.screening?.status || personData.status;
      console.log(`📊 [scopeGetPersonDetails] Screening status (attempt ${attempts}):`, screeningStatus);

      if (screeningStatus === 'completed' || screeningStatus === 'complete' || screeningStatus === 'finished') {
        screeningComplete = true;
        console.log('✅ [scopeGetPersonDetails] Screening complete!');
      } else if (screeningStatus === 'failed' || screeningStatus === 'error') {
        console.error('❌ [scopeGetPersonDetails] Screening failed:', screeningStatus);
        return Response.json({ 
          error: 'Screening failed',
          person: personData 
        }, { status: 500 });
      } else {
        console.log(`⏳ [scopeGetPersonDetails] Waiting ${pollInterval}ms before next poll...`);
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    if (!screeningComplete) {
      console.warn(`⏰ [scopeGetPersonDetails] Screening timeout after ${maxPolls} attempts`);
      return Response.json({ 
        error: 'Screening timeout - still processing',
        person: personData,
        screening_complete: false
      }, { status: 202 });
    }

    // Evaluate compliance
    console.log('🎯 [scopeGetPersonDetails] Evaluating compliance...');
    const evaluation = evaluateCompliance(personData);
    console.log('✅ [scopeGetPersonDetails] Compliance evaluation:', JSON.stringify(evaluation, null, 2));

    return Response.json({
      person: personData,
      screening_complete: true,
      evaluation
    });

  } catch (error) {
    console.error('❌ [scopeGetPersonDetails] Unexpected error:', {
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