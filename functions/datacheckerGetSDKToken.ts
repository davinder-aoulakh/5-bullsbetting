import { getOAuthToken } from './utils/datacheckerAuth.js';

const DATACHECKER_BASE_URL = Deno.env.get('DATACHECKER_BASE_URL') ?? 'https://developer.staging.datachecker.nl';
const USE_MOCK = Deno.env.get('USE_DATACHECKER_MOCK_API') === 'true';

Deno.serve(async (req) => {
  try {
    // No authentication check - this is called during onboarding before user creation
    const body = await req.json();
    const { services, customerReference, numberOfChallenges, validateWatermark } = body;

    console.log('🎫 Requesting SDK token for services:', services);
    console.log('📋 Customer reference:', customerReference ? 'provided' : 'not provided');

    if (USE_MOCK) {
      return Response.json({
        token: 'MOCK_SDK_TOKEN_' + services + '_' + Date.now(),
        transactionId: 'mock-transaction-' + Date.now()
      });
    }

    // ALWAYS use only productapi.sdk.read scope regardless of services
    const accessToken = await getOAuthToken(['productapi.sdk.read']);

    // Build SDK token request URL
    let sdkTokenUrl = `${DATACHECKER_BASE_URL}/api/v2/sdk/token?services=${services}`;
    
    if (customerReference) {
      sdkTokenUrl += `&customer_reference=${encodeURIComponent(customerReference)}`;
    }
    
    // Only append these for FACE_VERIFY
    if (services === 'FACE_VERIFY') {
      if (numberOfChallenges) {
        sdkTokenUrl += `&number_of_challenges=${numberOfChallenges}`;
      }
      if (validateWatermark !== undefined) {
        sdkTokenUrl += `&validateWatermark=${validateWatermark}`;
      }
    }

    const sdkTokenResponse = await fetch(sdkTokenUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!sdkTokenResponse.ok) {
      const error = await sdkTokenResponse.text();
      console.error('❌ SDK token request failed:', sdkTokenResponse.status);
      return Response.json({ 
        error: 'Failed to get SDK token'
      }, { status: sdkTokenResponse.status });
    }

    const sdkTokenData = await sdkTokenResponse.json();
    console.log('✅ SDK token obtained, transactionId:', sdkTokenData.transactionId);

    return Response.json({
      token: sdkTokenData.token,
      transactionId: sdkTokenData.transactionId
    });

  } catch (error) {
    console.error('❌ Error in datacheckerGetSDKToken:', error.message);
    return Response.json({ 
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
});