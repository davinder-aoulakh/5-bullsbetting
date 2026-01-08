import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getOAuthToken } from './utils/datacheckerAuth.js';

const DATACHECKER_BASE_URL = 'https://developer.staging.datachecker.nl';
const USE_MOCK = Deno.env.get('USE_DATACHECKER_MOCK_API') === 'true';

Deno.serve(async (req) => {
  try {
    // No authentication check - this is called during onboarding before user creation
    const body = await req.json();
    const { transactionId, images } = body;

    console.log('📤 Submitting ID verification:', {
      transactionId,
      imageCount: images?.length
    });

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

    // Get OAuth token with required scope
    const accessToken = await getOAuthToken(['productapi.idverify.write']);

    // Submit ID verification
    const idVerifyResponse = await fetch(`${DATACHECKER_BASE_URL}/api/v2/idverify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactionId,
        images
      })
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
    console.log('✅ ID verification submitted:', result);

    return Response.json(result);

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});