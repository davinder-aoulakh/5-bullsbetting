import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getOAuthToken } from './utils/datacheckerAuth.js';

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
    const { transactionId, images, valid_challenges } = body;

    console.log('📤 Submitting face verification:', {
      transactionId,
      imageCount: images?.length,
      validChallenges: valid_challenges
    });

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

    // Get OAuth token with required scope
    const accessToken = await getOAuthToken(['productapi.faceverify.write']);

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
    console.log('✅ Face verification submitted:', result);

    // Log verification attempt
    await base44.asServiceRole.entities.VerificationLog.create({
      user_id: user.id,
      verification_type: 'facial_recognition',
      provider: 'datachecker',
      reference_id: transactionId,
      status: 'initiated',
      result_details: {
        message: 'Face images submitted for liveness verification'
      }
    });

    return Response.json(result);

  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});