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

    const searchPayload = {
      first_name: userData.full_name?.split(' ')[0] || '',
      last_name: userData.full_name?.split(' ').slice(1).join(' ') || '',
      date_of_birth: userData.date_of_birth,
      country: userData.country
    };

    console.log('📤 [scopeSearchPerson] Search payload:', JSON.stringify(searchPayload, null, 2));
    console.log('🌐 [scopeSearchPerson] Request URL:', `${SCOPE_API_URL}/persons/search`);

    // Search for existing person in Scope
    const searchResponse = await fetch(`${SCOPE_API_URL}/persons/search`, {
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

    // Check if person exists
    const existingPerson = searchData.data && searchData.data.length > 0 ? searchData.data[0] : null;

    console.log('🎯 [scopeSearchPerson] Result:', {
      found: !!existingPerson,
      personId: existingPerson?.id
    });

    return Response.json({
      found: !!existingPerson,
      person: existingPerson
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