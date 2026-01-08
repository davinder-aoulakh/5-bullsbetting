import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getOAuthToken } from './utils/datacheckerAuth.js';

const DATACHECKER_BASE_URL = 'https://developer.staging.datachecker.nl';
const USE_MOCK = Deno.env.get('USE_DATACHECKER_MOCK_API') === 'true';

Deno.serve(async (req) => {
  try {
    // No authentication check - this is called during onboarding before user creation
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

    // Get OAuth token with minimal required scopes
    const scopes = services === 'FACE_VERIFY' 
      ? ['productapi.sdk.read', 'productapi.faceverify.write', 'productapi.poll.read', 'productapi.result.read']
      : ['productapi.sdk.read'];
    
    const accessToken = await getOAuthToken(scopes);

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