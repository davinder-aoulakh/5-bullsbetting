import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    console.log('🔍 [scopeSearchPerson] Function invoked');
    
    const body = await req.json();
    console.log('📥 [scopeSearchPerson] Request body:', JSON.stringify(body, null, 2));
    
    const { userData } = body;

    if (!userData) {
      console.error('❌ [scopeSearchPerson] userData is missing');
      return Response.json({ error: 'userData is required' }, { status: 400 });
    }

    const SCOPE_API_KEY = Deno.env.get('SCOPE_API_KEY');
    const SCOPE_API_URL = Deno.env.get('SCOPE_API_URL');

    console.log('🔑 [scopeSearchPerson] API Config:', {
      hasKey: !!SCOPE_API_KEY,
      keyLength: SCOPE_API_KEY?.length,
      url: SCOPE_API_URL
    });

    if (!SCOPE_API_KEY || !SCOPE_API_URL) {
      console.error('❌ [scopeSearchPerson] Missing Scope API credentials');
      return Response.json({ error: 'Scope API not configured' }, { status: 500 });
    }

    // Parse name into first and last
    const nameParts = (userData.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const searchPayload = {
      firstName,
      lastName,
      dateOfBirth: userData.date_of_birth,
      gender: "Unknown", // We don't collect gender
      countries: [userData.country],
      sets: {
        sanctionsCurrent: true,
        sanctionsFormer: true,
        regulatoryEnforcement: true,
        reputationalRisk: true,
        internationalInsolvency: true,
        profileOfInterest: true,
        pepCurrent: true,
        pepFormer: true,
        pepLinked: true,
        disqualifiedDirector: true,
        dutchLegalConstraints: userData.country === 'NL' ? "Required" : "No",
        dutchInsolvency: userData.country === 'NL' ? "Required" : "No",
        offshoreLeaks: "No"
      }
    };

    console.log('📤 [scopeSearchPerson] Search payload:', JSON.stringify(searchPayload, null, 2));
    console.log('🌐 [scopeSearchPerson] Request URL:', `${SCOPE_API_URL}/SearchPerson`);

    // Search for person in Scope
    const searchResponse = await fetch(`${SCOPE_API_URL}/SearchPerson`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchPayload)
    });

    console.log('📊 [scopeSearchPerson] Response status:', searchResponse.status);
    console.log('📊 [scopeSearchPerson] Response headers:', Object.fromEntries(searchResponse.headers.entries()));

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ [scopeSearchPerson] API Error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        body: errorText
      });
      return Response.json({ 
        error: 'Failed to search in Scope CDD',
        details: errorText,
        status: searchResponse.status
      }, { status: searchResponse.status });
    }

    const searchData = await searchResponse.json();
    console.log('✅ [scopeSearchPerson] Success response:', JSON.stringify(searchData, null, 2));

    console.log('🎯 [scopeSearchPerson] Result:', {
      matchCount: searchData.matchCount,
      hasMatches: searchData.matchCount > 0
    });

    return Response.json({
      matchCount: searchData.matchCount,
      sessionId: searchData.sessionId,
      matches: searchData.matches || [],
      sets: searchData.sets
    });

  } catch (error) {
    console.error('❌ [scopeSearchPerson] Unexpected error:', {
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