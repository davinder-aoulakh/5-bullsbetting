import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Compliance evaluation logic based on Scope flags and details
function evaluateCompliance(matches, personDetails) {
  const evaluation = {
    approved: false,
    status: 'pending',
    reason: null,
    risk_score: 0,
    flags_found: []
  };

  // If no matches found, user is clean - approve immediately
  if (!matches || matches.length === 0) {
    evaluation.approved = true;
    evaluation.status = 'approved';
    evaluation.reason = 'No adverse records found';
    console.log('✅ [evaluateCompliance] No matches - APPROVED');
    return evaluation;
  }

  console.log(`🔍 [evaluateCompliance] Evaluating ${matches.length} match(es)`);

  // Check flags from matches
  const allFlags = matches.flatMap(m => m.flags || []);
  evaluation.flags_found = [...new Set(allFlags)]; // Remove duplicates

  console.log('🚩 [evaluateCompliance] Flags found:', evaluation.flags_found);

  // Critical flags that lead to automatic rejection
  const criticalFlags = [
    'SanctionsCurrent',
    'sanctionsCurrent'
  ];

  // High-risk flags that need manual review
  const highRiskFlags = [
    'RegulatoryEnforcement',
    'ReputationalRisk',
    'DisqualifiedDirector',
    'SanctionsFormer',
    'sanctionsFormer'
  ];

  // Check for critical flags
  const hasCriticalFlag = evaluation.flags_found.some(flag => 
    criticalFlags.some(cf => flag.toLowerCase() === cf.toLowerCase())
  );

  if (hasCriticalFlag) {
    evaluation.approved = false;
    evaluation.status = 'rejected';
    evaluation.reason = 'User is on current sanctions list';
    evaluation.risk_score = 100;
    console.log('❌ [evaluateCompliance] Critical flag detected - REJECTED');
    return evaluation;
  }

  // Check for high-risk flags
  const hasHighRiskFlag = evaluation.flags_found.some(flag => 
    highRiskFlags.some(hrf => flag.toLowerCase() === hrf.toLowerCase())
  );

  if (hasHighRiskFlag) {
    evaluation.approved = false;
    evaluation.status = 'manual_review';
    evaluation.reason = 'High-risk indicators found - requires manual review';
    evaluation.risk_score = 75;
    console.log('⚠️ [evaluateCompliance] High-risk flag detected - MANUAL REVIEW');
    return evaluation;
  }

  // Check PEP levels if person details available
  if (personDetails && personDetails.length > 0) {
    for (const person of personDetails) {
      // Current PEPs - automatic rejection for high-level positions
      if (person.currentPEPs && person.currentPEPs.length > 0) {
        const pepLevel = person.pepLevel || 0;
        if (pepLevel <= 2) { // Level 1-2 are high-risk PEPs
          evaluation.approved = false;
          evaluation.status = 'rejected';
          evaluation.reason = 'High-level Politically Exposed Person (PEP)';
          evaluation.risk_score = 90;
          console.log('❌ [evaluateCompliance] High-level PEP detected - REJECTED');
          return evaluation;
        } else {
          evaluation.approved = false;
          evaluation.status = 'manual_review';
          evaluation.reason = 'Politically Exposed Person (PEP) detected';
          evaluation.risk_score = 60;
          console.log('⚠️ [evaluateCompliance] PEP detected - MANUAL REVIEW');
          return evaluation;
        }
      }

      // Former PEPs - manual review
      if (person.formerPEPs && person.formerPEPs.length > 0) {
        evaluation.approved = false;
        evaluation.status = 'manual_review';
        evaluation.reason = 'Former Politically Exposed Person (PEP)';
        evaluation.risk_score = 50;
        console.log('⚠️ [evaluateCompliance] Former PEP detected - MANUAL REVIEW');
        return evaluation;
      }
    }
  }

  // Medium-risk flags (PEP-related) that need review
  const mediumRiskFlags = [
    'PEPCurrent',
    'pepCurrent',
    'PEPFormer',
    'pepFormer',
    'PEPLinked',
    'pepLinked'
  ];

  const hasMediumRiskFlag = evaluation.flags_found.some(flag => 
    mediumRiskFlags.some(mrf => flag.toLowerCase() === mrf.toLowerCase())
  );

  if (hasMediumRiskFlag) {
    evaluation.approved = false;
    evaluation.status = 'manual_review';
    evaluation.reason = 'PEP-related indicators found';
    evaluation.risk_score = 55;
    console.log('⚠️ [evaluateCompliance] PEP-related flag detected - MANUAL REVIEW');
    return evaluation;
  }

  // Low-risk flags (insolvency, etc.) - still approve but log
  const lowRiskFlags = [
    'InternationalInsolvency',
    'ProfileOfInterest',
    'OffshoreLeaks'
  ];

  const hasLowRiskFlag = evaluation.flags_found.some(flag => 
    lowRiskFlags.some(lrf => flag.toLowerCase() === lrf.toLowerCase())
  );

  if (hasLowRiskFlag) {
    evaluation.approved = true;
    evaluation.status = 'approved';
    evaluation.reason = 'Low-risk indicators found - approved with monitoring';
    evaluation.risk_score = 30;
    console.log('✅ [evaluateCompliance] Low-risk flags only - APPROVED');
    return evaluation;
  }

  // If we got matches but no concerning flags, still approve
  evaluation.approved = true;
  evaluation.status = 'approved';
  evaluation.reason = 'Matches found but no concerning indicators';
  evaluation.risk_score = 20;
  console.log('✅ [evaluateCompliance] Matches but no concerns - APPROVED');
  return evaluation;
}

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

    // Step 1: Search for person
    console.log('🔍 [scopeCompleteVerification] Step 1: Searching for person...');
    const searchResponse = await base44.asServiceRole.functions.invoke('scopeSearchPerson', {
      userData
    });

    console.log('📊 [scopeCompleteVerification] Search response:', JSON.stringify(searchResponse.data, null, 2));

    if (searchResponse.data.error) {
      console.error('❌ [scopeCompleteVerification] Search failed:', searchResponse.data.error);
      throw new Error(searchResponse.data.error);
    }

    const { matchCount, matches, sessionId: scopeSessionId } = searchResponse.data;

    console.log(`📊 [scopeCompleteVerification] Found ${matchCount} match(es)`);

    // If no matches, user is clean - approve immediately
    if (matchCount === 0) {
      console.log('✅ [scopeCompleteVerification] No matches found - user is clean!');
      
      const verificationRecord = {
        user_id: sessionId || userData.email,
        status: 'approved',
        risk_score: 0,
        sanctions_hit: false,
        pep_hit: false,
        adverse_media_hit: false,
        scope_response: { matchCount: 0, message: 'No adverse records found' },
        screening_date: new Date().toISOString()
      };

      const savedVerification = await base44.asServiceRole.entities.ScopeVerification.create(verificationRecord);
      console.log('✅ [scopeCompleteVerification] Verification saved with ID:', savedVerification.id);

      return Response.json({
        status: 'approved',
        approved: true,
        reason: 'No adverse records found',
        risk_score: 0,
        verification_id: savedVerification.id,
        match_count: 0
      });
    }

    // Step 2: Get details for each match
    console.log('📊 [scopeCompleteVerification] Step 2: Getting person details for matches...');
    const personDetails = [];

    for (const match of matches) {
      console.log(`🔍 [scopeCompleteVerification] Getting details for: ${match.name} (${match.complianceId})`);
      
      const detailsResponse = await base44.asServiceRole.functions.invoke('scopeGetPersonDetails', {
        complianceId: match.complianceId
      });

      if (detailsResponse.data.error) {
        console.error('❌ [scopeCompleteVerification] Details failed:', detailsResponse.data.error);
        // Continue with other matches even if one fails
        continue;
      }

      personDetails.push(detailsResponse.data.person);
    }

    console.log(`✅ [scopeCompleteVerification] Retrieved ${personDetails.length} person detail(s)`);

    // Step 3: Evaluate compliance
    console.log('🎯 [scopeCompleteVerification] Step 3: Evaluating compliance...');
    const evaluation = evaluateCompliance(matches, personDetails);
    console.log('✅ [scopeCompleteVerification] Compliance evaluation:', JSON.stringify(evaluation, null, 2));

    // Step 4: Save verification results to database
    const verificationRecord = {
      user_id: sessionId || userData.email,
      status: evaluation.status,
      risk_score: evaluation.risk_score,
      sanctions_hit: evaluation.flags_found.some(f => f.toLowerCase().includes('sanction')),
      pep_hit: evaluation.flags_found.some(f => f.toLowerCase().includes('pep')),
      adverse_media_hit: evaluation.flags_found.some(f => f.toLowerCase().includes('reputational') || f.toLowerCase().includes('adverse')),
      rejection_reason: evaluation.reason,
      scope_response: {
        matchCount,
        matches,
        personDetails,
        scopeSessionId
      },
      screening_date: new Date().toISOString()
    };

    console.log('💾 [scopeCompleteVerification] Saving verification record');

    const savedVerification = await base44.asServiceRole.entities.ScopeVerification.create(verificationRecord);
    console.log('✅ [scopeCompleteVerification] Verification saved with ID:', savedVerification.id);

    const result = {
      status: evaluation.status,
      approved: evaluation.approved,
      reason: evaluation.reason,
      risk_score: evaluation.risk_score,
      verification_id: savedVerification.id,
      match_count: matchCount,
      flags_found: evaluation.flags_found
    };

    console.log('🎯 [scopeCompleteVerification] Final result:', JSON.stringify(result, null, 2));

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