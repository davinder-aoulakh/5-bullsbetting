import { getOAuthToken } from './utils/datacheckerAuth.js';

const DATACHECKER_BASE_URL = Deno.env.get('DATACHECKER_BASE_URL') ?? 'https://developer.staging.datachecker.nl';
const USE_MOCK = Deno.env.get('USE_DATACHECKER_MOCK_API') === 'true';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { resultId, expectedProduct } = body;

    if (!resultId) {
      return Response.json({ 
        error: 'resultId is required' 
      }, { status: 400 });
    }

    console.log('📥 Getting result for resultId:', resultId, 'expectedProduct:', expectedProduct || 'not specified');

    const accessToken = await getOAuthToken(['productapi.result.read']);

    const response = await fetch(
      `${DATACHECKER_BASE_URL}/api/v2/result/${resultId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      console.error('❌ Get result failed:', response.status);
      return Response.json({ 
        error: 'Failed to get verification result'
      }, { status: response.status });
    }

    const data = await response.json();

    console.log('✅ Result retrieved, product:', data.product);

    // Determine approval based on what exists and expectedProduct
    const identityApproved = data.identity?.result === 'APPROVED';
    const faceApproved = data.faceVerify?.result === 'APPROVED';
    
    let approved;
    
    if (expectedProduct) {
      if (expectedProduct === 'FACE_VERIFY') {
        approved = faceApproved;
      } else if (expectedProduct.startsWith('IDV')) {
        approved = identityApproved;
      } else {
        approved = identityApproved && faceApproved;
      }
    } else {
      // No expected product specified
      if (data.identity && data.faceVerify) {
        approved = identityApproved && faceApproved;
      } else if (data.identity) {
        approved = identityApproved;
      } else if (data.faceVerify) {
        approved = faceApproved;
      } else {
        approved = false;
      }
    }

    return Response.json({
      approved,
      identityApproved,
      faceApproved,
      result: data.result,
      identity: data.identity ? {
        result: data.identity.result,
        data: data.identity.data
      } : null,
      faceVerify: data.faceVerify ? {
        result: data.faceVerify.result
      } : null,
      images: data.images || [],
      transactionId: data.transactionId
    });

  } catch (error) {
    console.error('❌ Error in datacheckerGetResult:', error.message);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});