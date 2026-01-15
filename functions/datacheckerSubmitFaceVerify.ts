const DATACHECKER_BASE_URL = Deno.env.get('DATACHECKER_BASE_URL') ?? 'https://developer.staging.datachecker.nl';
const USE_MOCK = Deno.env.get('USE_DATACHECKER_MOCK_API') === 'true';

Deno.serve(async (req) => {
  try {
    // No authentication check - this is called during onboarding before user creation
    const body = await req.json();
    const { transactionId, images, valid_challenges } = body;

    console.log('📤 Submitting face verification, transactionId:', transactionId, 'images count:', images?.length);

    if (!transactionId || !images || images.length === 0) {
      return Response.json({ 
        error: 'transactionId and images are required' 
      }, { status: 400 });
    }

    // Validate that first image is COMPARE type
    if (images[0].type !== 'COMPARE') {
      return Response.json({
        error: 'First image must be of type COMPARE (portrait from ID document)'
      }, { status: 400 });
    }

    if (USE_MOCK) {
      // Return mock success response
      console.log('🎭 Using mock API - returning success');
      return Response.json({
        transactionId,
        success: true,
        message: 'Mock submission successful'
      });
    }

    // Get OAuth token directly
    const clientId = Deno.env.get('DATACHECKER_CLIENT_ID');
    const clientSecret = Deno.env.get('DATACHECKER_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return Response.json({ 
        error: 'DataChecker credentials not configured' 
      }, { status: 500 });
    }

    const authHeader = 'Basic ' + btoa(`${clientId}:${clientSecret}`);
    
    const tokenResponse = await fetch(`${DATACHECKER_BASE_URL}/api/v2/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scopes: ['productapi.faceverify.write']
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ OAuth token request failed:', tokenResponse.status);
      return Response.json({ 
        error: 'Failed to authenticate with DataChecker'
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.accessToken;

    // Submit face verification
    const requestBody = {
      transactionId,
      images
    };

    // Include valid_challenges if provided
    if (valid_challenges !== undefined) {
      requestBody.valid_challenges = valid_challenges;
    }

    const faceVerifyResponse = await fetch(`${DATACHECKER_BASE_URL}/api/v2/faceverify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!faceVerifyResponse.ok) {
      const error = await faceVerifyResponse.text();
      console.error('❌ Face verify submission error:', error);
      return Response.json({ 
        error: 'Failed to submit face verification',
        details: error
      }, { status: faceVerifyResponse.status });
    }

    const result = await faceVerifyResponse.json();
    console.log('✅ Face verification submitted successfully');

    return Response.json(result);

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});