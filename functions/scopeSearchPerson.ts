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
      keyPrefix: SCOPE_API_KEY ? `${SCOPE_API_KEY.substring(0, 4)}...${SCOPE_API_KEY.substring(SCOPE_API_KEY.length - 4)}` : 'N/A',
      url: SCOPE_API_URL,
      fullUrl: `${SCOPE_API_URL}/SearchPerson`
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
      gender: "Male", // Default gender as API doesn't accept "Unknown"
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
    const requestHeaders = {
      'API-Key': SCOPE_API_KEY,
      'Content-Type': 'application/json'
    };
    
    console.log('📤 [scopeSearchPerson] Request headers:', {
      'API-Key': `${SCOPE_API_KEY.substring(0, 8)}...`,
      'Content-Type': requestHeaders['Content-Type']
    });
    
    const requestStart = Date.now();
    const searchResponse = await fetch(`${SCOPE_API_URL}/SearchPerson`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(searchPayload)
    });
    const requestDuration = Date.now() - requestStart;

    console.log('📊 [scopeSearchPerson] Response received in', requestDuration, 'ms');
    console.log('📊 [scopeSearchPerson] Response status:', searchResponse.status);
    console.log('📊 [scopeSearchPerson] Response statusText:', searchResponse.statusText);
    console.log('📊 [scopeSearchPerson] Response headers:', Object.fromEntries(searchResponse.headers.entries()));

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ [scopeSearchPerson] API Error Details:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        url: `${SCOPE_API_URL}/SearchPerson`,
        requestPayload: searchPayload,
        responseBody: errorText,
        responseHeaders: Object.fromEntries(searchResponse.headers.entries())
      });
      
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
        console.error('❌ [scopeSearchPerson] Parsed error:', parsedError);
      } catch (e) {
        console.error('❌ [scopeSearchPerson] Error response is not JSON:', errorText);
      }
      
      // Add helpful error messages based on status code
      let troubleshooting = '';
      if (searchResponse.status === 403) {
        troubleshooting = 'API key might be invalid, expired, or lacks necessary permissions. Check: 1) API key is correct in SCOPE_API_KEY secret, 2) Key has access to SearchPerson endpoint, 3) Test environment credentials are being used for test-cmp.scope.nl';
      } else if (searchResponse.status === 401) {
        troubleshooting = 'Authentication failed. Verify SCOPE_API_KEY secret is set correctly and not expired.';
      } else if (searchResponse.status === 404) {
        troubleshooting = 'Endpoint not found. Verify SCOPE_API_URL is correct (should be https://test-cmp.scope.nl/api/v4 or https://cmp.scope.nl/api/v4).';
      }
      
      return Response.json({ 
        error: 'Failed to search in Scope CDD',
        details: errorText,
        parsedError: parsedError || null,
        status: searchResponse.status,
        url: `${SCOPE_API_URL}/SearchPerson`,
        troubleshooting
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