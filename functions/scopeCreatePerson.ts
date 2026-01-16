import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { userData } = body;

    if (!userData) {
      return Response.json({ error: 'userData is required' }, { status: 400 });
    }

    const SCOPE_API_KEY = Deno.env.get('SCOPE_API_KEY');
    const SCOPE_API_URL = Deno.env.get('SCOPE_API_URL');

    if (!SCOPE_API_KEY || !SCOPE_API_URL) {
      console.error('❌ Missing Scope API credentials');
      return Response.json({ error: 'Scope API not configured' }, { status: 500 });
    }

    console.log('➕ Creating person in Scope CDD:', {
      name: userData.full_name,
      dob: userData.date_of_birth,
      country: userData.country
    });

    // Create person in Scope and initiate screening
    const createResponse = await fetch(`${SCOPE_API_URL}/persons`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Scope create failed:', createResponse.status, errorText);
      return Response.json({ 
        error: 'Failed to create person in Scope CDD',
        details: errorText 
      }, { status: createResponse.status });
    }

    const createData = await createResponse.json();
    console.log('✅ Person created in Scope:', createData);

    return Response.json({
      person_id: createData.data?.id || createData.id,
      person: createData.data || createData
    });

  } catch (error) {
    console.error('❌ Error creating person:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});