import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DATACHECKER_BASE_URL = 'https://developer.staging.datachecker.nl';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { resultId } = body;

    if (!resultId) {
      return Response.json({ 
        error: 'resultId is required' 
      }, { status: 400 });
    }

    // Get access token directly
    const clientId = Deno.env.get('DATACHECKER_CLIENT_ID');
    const clientSecret = Deno.env.get('DATACHECKER_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return Response.json({ 
        error: 'DataChecker credentials not configured' 
      }, { status: 500 });
    }

    const authHeader = 'Basic ' + btoa(`${clientId}:${clientSecret}`);
    
    const tokenResponse = await fetch(`https://developer.staging.datachecker.nl/api/v2/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scopes: ['productapi.result.read']
      })
    });

    if (!tokenResponse.ok) {
      return Response.json({ 
        error: 'Failed to authenticate with DataChecker'
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.accessToken;

    // Get detailed result
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
      const error = await response.text();
      return Response.json({ 
        error: 'Failed to get verification result',
        details: error
      }, { status: response.status });
    }

    const data = await response.json();

    // Determine overall status
    const identityApproved = data.identity?.result === 'APPROVED';
    const faceApproved = data.faceVerify?.result === 'APPROVED';
    const overallApproved = identityApproved && faceApproved;

    // Note: Verification log will be created when user account is created after successful verification

    return Response.json({
      approved: overallApproved,
      result: data.result,
      identity: {
        result: data.identity?.result,
        data: data.identity?.data
      },
      faceVerify: {
        result: data.faceVerify?.result
      },
      transactionId: data.transactionId
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});