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

    console.log('📝 Creating user account for:', email);
    
    const base44 = createClientFromRequest(req);
    
    // Create user directly with service role
    const signUpPayload = {
      email,
      password,
      full_name: userData.full_name,
      ...userData
    };
    
    console.log('📤 Sign up payload:', { email, full_name: userData.full_name });
    
    const result = await base44.asServiceRole.auth.signUp(signUpPayload);
    
    console.log('✅ User created successfully:', result?.id);

    return Response.json({
      success: true,
      user: result
    });

  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    console.error('❌ Full error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});