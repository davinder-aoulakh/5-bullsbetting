import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DATACHECKER_BASE_URL = 'https://developer.staging.datachecker.nl';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await base44.auth.me();

    const body = await req.json();
    const { transactionId } = body;

    if (!transactionId) {
      return Response.json({ 
        error: 'transactionId is required' 
      }, { status: 400 });
    }

    // Get access token
    const tokenResponse = await base44.functions.invoke('datacheckerAuth');
    if (!tokenResponse.data?.accessToken) {
      return Response.json({ 
        error: 'Failed to get authentication token' 
      }, { status: 500 });
    }

    const accessToken = tokenResponse.data.accessToken;

    // Poll for results
    const response = await fetch(
      `${DATACHECKER_BASE_URL}/api/v2/poll?transactionId=${transactionId}`,
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
        error: 'Failed to poll verification status',
        details: error
      }, { status: response.status });
    }

    const data = await response.json();

    return Response.json({
      results: data.results || [],
      completed: data.results && data.results.length > 0
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});