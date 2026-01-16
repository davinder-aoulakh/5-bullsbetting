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

    console.log('🔍 Searching for person in Scope CDD:', {
      name: userData.full_name,
      dob: userData.date_of_birth,
      country: userData.country
    });

    // Search for existing person in Scope
    const searchResponse = await fetch(`${SCOPE_API_URL}/persons/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        first_name: userData.full_name?.split(' ')[0] || '',
        last_name: userData.full_name?.split(' ').slice(1).join(' ') || '',
        date_of_birth: userData.date_of_birth,
        country: userData.country
      })
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ Scope search failed:', searchResponse.status, errorText);
      return Response.json({ 
        error: 'Failed to search in Scope CDD',
        details: errorText 
      }, { status: searchResponse.status });
    }

    const searchData = await searchResponse.json();
    console.log('✅ Scope search response:', searchData);

    // Check if person exists
    const existingPerson = searchData.data && searchData.data.length > 0 ? searchData.data[0] : null;

    return Response.json({
      found: !!existingPerson,
      person: existingPerson
    });

  } catch (error) {
    console.error('❌ Error searching person:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});