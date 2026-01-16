import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { email, password, userData } = body;

    if (!email || !password) {
      return Response.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    
    // Create the user account using service role
    const signUpUrl = `${Deno.env.get('BASE44_API_URL') || 'https://api.base44.com'}/auth/signup`;
    
    const signUpResponse = await fetch(signUpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': Deno.env.get('BASE44_APP_ID')
      },
      body: JSON.stringify({
        email,
        password,
        metadata: userData
      })
    });

    if (!signUpResponse.ok) {
      const error = await signUpResponse.json();
      throw new Error(error.message || 'Failed to create account');
    }

    const result = await signUpResponse.json();
    
    console.log('✅ User created successfully:', result.user?.id);

    return Response.json({
      success: true,
      user: result.user
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});