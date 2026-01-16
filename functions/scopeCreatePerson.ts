import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    console.log('➕ [scopeCreatePerson] Function invoked');
    
    const body = await req.json();
    console.log('📥 [scopeCreatePerson] Request body:', JSON.stringify(body, null, 2));
    
    const { userData } = body;

    if (!userData) {
      console.error('❌ [scopeCreatePerson] userData is missing');
      return Response.json({ error: 'userData is required' }, { status: 400 });
    }

    const SCOPE_API_KEY = Deno.env.get('SCOPE_API_KEY');
    const SCOPE_API_URL = Deno.env.get('SCOPE_API_URL');

    console.log('🔑 [scopeCreatePerson] API Config:', {
      hasKey: !!SCOPE_API_KEY,
      keyLength: SCOPE_API_KEY?.length,
      url: SCOPE_API_URL
    });

    if (!SCOPE_API_KEY || !SCOPE_API_URL) {
      console.error('❌ [scopeCreatePerson] Missing Scope API credentials');
      return Response.json({ error: 'Scope API not configured' }, { status: 500 });
    }

    const createPayload = {
      first_name: userData.full_name?.split(' ')[0] || '',
      last_name: userData.full_name?.split(' ').slice(1).join(' ') || '',
      date_of_birth: userData.date_of_birth,
      country: userData.country,
      nationality: userData.country,
      id_type: userData.id_type,
      id_number: userData.id_value || userData.cpf,
      screening: {
        sanctions: true,
        pep: true,
        adverse_media: true
      }
    };

    console.log('📤 [scopeCreatePerson] Create payload:', JSON.stringify(createPayload, null, 2));
    console.log('🌐 [scopeCreatePerson] Request URL:', `${SCOPE_API_URL}/persons`);

    // Create person in Scope and initiate screening
    const createResponse = await fetch(`${SCOPE_API_URL}/persons`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createPayload)
    });

    console.log('📊 [scopeCreatePerson] Response status:', createResponse.status);
    console.log('📊 [scopeCreatePerson] Response headers:', Object.fromEntries(createResponse.headers.entries()));

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ [scopeCreatePerson] API Error:', {
        status: createResponse.status,
        statusText: createResponse.statusText,
        body: errorText
      });
      return Response.json({ 
        error: 'Failed to create person in Scope CDD',
        details: errorText,
        status: createResponse.status
      }, { status: createResponse.status });
    }

    const createData = await createResponse.json();
    console.log('✅ [scopeCreatePerson] Success response:', JSON.stringify(createData, null, 2));

    const personId = createData.data?.id || createData.id;
    console.log('🎯 [scopeCreatePerson] Person ID:', personId);

    return Response.json({
      person_id: personId,
      person: createData.data || createData
    });

  } catch (error) {
    console.error('❌ [scopeCreatePerson] Unexpected error:', {
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