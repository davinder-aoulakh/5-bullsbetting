const DATACHECKER_BASE_URL = Deno.env.get('DATACHECKER_BASE_URL') ?? 'https://developer.staging.datachecker.nl';
const USE_MOCK = Deno.env.get('USE_DATACHECKER_MOCK_API') === 'true';
const IDV_PRODUCT = Deno.env.get('DATACHECKER_IDV_PRODUCT') ?? 'IDV_LITE';

Deno.serve(async (req) => {
  try {
    // No authentication check - this is called during onboarding before user creation
    const body = await req.json();
    const { transactionId, images } = body;

    console.log('📤 Submitting ID verification, transactionId:', transactionId, 'images count:', images?.length);
    console.log('📸 Image details:', images.map((img, i) => ({ 
      index: i, 
      type: img.type, 
      pageType: img.pageType,
      hasData: !!img.data, 
      dataLength: img.data?.length 
    })));

    if (!transactionId || !images || images.length === 0) {
      return Response.json({ 
        error: 'transactionId and images are required' 
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
        scopes: ['productapi.idverify.write']
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

    // Submit ID verification
    const payload = {
      transactionId,
      product: IDV_PRODUCT,
      images
    };
    
    console.log('📦 Payload being sent:', JSON.stringify({
      transactionId: payload.transactionId,
      product: payload.product,
      images: payload.images.map(img => ({ type: img.type, dataLength: img.data?.length }))
    }));
    
    const idVerifyResponse = await fetch(`${DATACHECKER_BASE_URL}/api/v2/idverify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!idVerifyResponse.ok) {
      const error = await idVerifyResponse.text();
      console.error('❌ ID verify submission error:', error);
      return Response.json({ 
        error: 'Failed to submit ID verification',
        details: error
      }, { status: idVerifyResponse.status });
    }

    const result = await idVerifyResponse.json();
    console.log('✅ ID verification submitted successfully');

    return Response.json(result);

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});