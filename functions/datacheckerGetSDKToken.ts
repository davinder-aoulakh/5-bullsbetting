import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DATACHECKER_BASE_URL = 'https://developer.staging.datachecker.nl';
const USE_MOCK = Deno.env.get('USE_DATACHECKER_MOCK_API') === 'true';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { services, customerReference, numberOfChallenges, validateWatermark } = body;

    console.log('🎫 Requesting SDK token for services:', services);

    if (USE_MOCK) {
      // Return mock SDK token for testing
      return Response.json({
        token: 'MOCK_SDK_TOKEN_' + services + '_' + Date.now(),
        transactionId: 'mock-transaction-' + Date.now(),
        services
      });
    }

    // Get OAuth token
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
        scopes: [
          'productapi.sdk.read',
          'productapi.idverify.write',
          'productapi.faceverify.write',
          'productapi.poll.read',
          'productapi.result.read'
        ]
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ OAuth token error:', error);
      return Response.json({ 
        error: 'Failed to authenticate with DataChecker'
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.accessToken;

    // Build SDK token request URL
    let sdkTokenUrl = `${DATACHECKER_BASE_URL}/api/v2/sdk/token?services=${services}`;
    
    if (customerReference) {
      sdkTokenUrl += `&customer_reference=${encodeURIComponent(customerReference)}`;
    }
    
    if (numberOfChallenges) {
      sdkTokenUrl += `&number_of_challenges=${numberOfChallenges}`;
    }
    
    if (validateWatermark !== undefined) {
      sdkTokenUrl += `&validateWatermark=${validateWatermark}`;
    }

    console.log('🌐 SDK token URL:', sdkTokenUrl);

    const sdkTokenResponse = await fetch(sdkTokenUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!sdkTokenResponse.ok) {
      const error = await sdkTokenResponse.text();
      console.error('❌ SDK token error:', error);
      return Response.json({ 
        error: 'Failed to get SDK token',
        details: error
      }, { status: sdkTokenResponse.status });
    }

    const sdkTokenData = await sdkTokenResponse.json();
    console.log('✅ SDK token obtained:', sdkTokenData);

    return Response.json(sdkTokenData);

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});