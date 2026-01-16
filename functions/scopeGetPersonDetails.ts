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
      url: SCOPE_API_URL
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

    const requestStart = Date.now();
    const detailsResponse = await fetch(`${SCOPE_API_URL}/GetPersonDetails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
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
      
      return Response.json({ 
        error: 'Failed to get person details from Scope',
        details: errorText,
        parsedError: parsedError || null,
        status: detailsResponse.status,
        url: `${SCOPE_API_URL}/GetPersonDetails`
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