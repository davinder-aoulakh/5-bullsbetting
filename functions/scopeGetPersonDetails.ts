import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    console.log('📊 [scopeGetPersonDetails] Function invoked');
    
    const body = await req.json();
    console.log('📥 [scopeGetPersonDetails] Request body:', JSON.stringify(body, null, 2));
    
    const { complianceId } = body;

    if (!complianceId) {
      console.error('❌ [scopeGetPersonDetails] complianceId is missing');
      return Response.json({ error: 'complianceId is required' }, { status: 400 });
    }

    const SCOPE_API_KEY = Deno.env.get('SCOPE_API_KEY');
    const SCOPE_API_URL = Deno.env.get('SCOPE_API_URL');

    console.log('🔑 [scopeGetPersonDetails] API Config:', {
      hasKey: !!SCOPE_API_KEY,
      keyLength: SCOPE_API_KEY?.length,
      keyPrefix: SCOPE_API_KEY ? `${SCOPE_API_KEY.substring(0, 4)}...${SCOPE_API_KEY.substring(SCOPE_API_KEY.length - 4)}` : 'N/A',
      url: SCOPE_API_URL,
      fullUrl: `${SCOPE_API_URL}/GetPersonDetails`
    });

    if (!SCOPE_API_KEY || !SCOPE_API_URL) {
      console.error('❌ [scopeGetPersonDetails] Missing Scope API credentials');
      return Response.json({ error: 'Scope API not configured' }, { status: 500 });
    }

    console.log('🔄 [scopeGetPersonDetails] Getting details for complianceId:', complianceId);

    const requestPayload = {
      complianceId
    };

    console.log('📤 [scopeGetPersonDetails] Request payload:', JSON.stringify(requestPayload, null, 2));
    console.log('🌐 [scopeGetPersonDetails] Request URL:', `${SCOPE_API_URL}/GetPersonDetails`);

    const requestHeaders = {
      'Authorization': `Bearer ${SCOPE_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    console.log('📤 [scopeGetPersonDetails] Request headers:', {
      'Authorization': `Bearer ${SCOPE_API_KEY.substring(0, 8)}...`,
      'Content-Type': requestHeaders['Content-Type']
    });
    
    const requestStart = Date.now();
    const detailsResponse = await fetch(`${SCOPE_API_URL}/GetPersonDetails`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestPayload)
    });
    const requestDuration = Date.now() - requestStart;

    console.log('📊 [scopeGetPersonDetails] Response received in', requestDuration, 'ms');
    console.log('📊 [scopeGetPersonDetails] Response status:', detailsResponse.status);
    console.log('📊 [scopeGetPersonDetails] Response statusText:', detailsResponse.statusText);
    console.log('📊 [scopeGetPersonDetails] Response headers:', Object.fromEntries(detailsResponse.headers.entries()));

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('❌ [scopeGetPersonDetails] API Error Details:', {
        status: detailsResponse.status,
        statusText: detailsResponse.statusText,
        url: `${SCOPE_API_URL}/GetPersonDetails`,
        requestPayload: requestPayload,
        responseBody: errorText,
        responseHeaders: Object.fromEntries(detailsResponse.headers.entries())
      });
      
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
        console.error('❌ [scopeGetPersonDetails] Parsed error:', parsedError);
      } catch (e) {
        console.error('❌ [scopeGetPersonDetails] Error response is not JSON:', errorText);
      }
      
      // Add helpful error messages based on status code
      let troubleshooting = '';
      if (detailsResponse.status === 403) {
        troubleshooting = 'API key might be invalid, expired, or lacks necessary permissions. Check SCOPE_API_KEY secret configuration.';
      } else if (detailsResponse.status === 401) {
        troubleshooting = 'Authentication failed. Verify SCOPE_API_KEY secret is set correctly.';
      } else if (detailsResponse.status === 404) {
        troubleshooting = 'Compliance ID not found or endpoint incorrect. Verify the complianceId and SCOPE_API_URL.';
      }
      
      return Response.json({ 
        error: 'Failed to get person details from Scope',
        details: errorText,
        parsedError: parsedError || null,
        status: detailsResponse.status,
        url: `${SCOPE_API_URL}/GetPersonDetails`,
        troubleshooting
      }, { status: detailsResponse.status });
    }

    const personData = await detailsResponse.json();
    console.log('✅ [scopeGetPersonDetails] Success response:', JSON.stringify(personData, null, 2));

    return Response.json({
      person: personData
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