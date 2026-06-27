const DATACHECKER_BASE_URL = Deno.env.get('DATACHECKER_BASE_URL') ?? 'https://developer.staging.datachecker.nl';
const USE_MOCK = Deno.env.get('USE_DATACHECKER_MOCK_API') === 'true';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { transactionId, customerReference, expectedProduct } = body;

    if (!transactionId) {
      return Response.json({ 
        error: 'transactionId is required' 
      }, { status: 400 });
    }

    console.log('🔍 Polling for transactionId:', transactionId);

    if (USE_MOCK) {
      return Response.json({
        completed: true,
        resultId: 'mock-result-' + Date.now(),
        product: expectedProduct || 'IDV_LITE'
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
        scopes: ['productapi.poll.read']
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

    const pollUrl = `${DATACHECKER_BASE_URL}/api/v2/poll`;
    
    const response = await fetch(pollUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('❌ Poll request failed:', response.status);
      return Response.json({ 
        error: 'Failed to poll verification status'
      }, { status: response.status });
    }

    const data = await response.json();

    // Find the specific transaction in the results array
    let transactionResult;
    
    if (customerReference && expectedProduct) {
      // Match by transactionId, customerReference, and product
      transactionResult = data.results?.find(
        r => r.transactionId === transactionId && 
             r.customerReference === customerReference &&
             r.product === expectedProduct
      );
    } else {
      // Fallback: match by transactionId only
      transactionResult = data.results?.find(
        r => r.transactionId === transactionId
      );
    }

    console.log('🔍 Results found:', data.results?.length || 0, 'Matched:', transactionResult ? 'Yes' : 'No');

    if (!transactionResult) {
      return Response.json({
        completed: false,
        resultId: null,
        product: null
      });
    }

    return Response.json({
      completed: true,
      resultId: transactionResult.resultId,
      product: transactionResult.product || null
    });

  } catch (error) {
    console.error('❌ Error in datacheckerPoll:', error.message);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});