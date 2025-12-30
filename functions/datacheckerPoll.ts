import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DATACHECKER_BASE_URL = 'https://developer.staging.datachecker.nl';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { transactionId } = body;

    console.log('🔍 Polling request received for transactionId:', transactionId);

    if (!transactionId) {
      return Response.json({ 
        error: 'transactionId is required' 
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
        scopes: ['productapi.poll.read', 'productapi.result.read']
      })
    });

    if (!tokenResponse.ok) {
      return Response.json({ 
        error: 'Failed to authenticate with DataChecker'
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.accessToken;

    // Poll for all results (no transactionId query parameter)
    const pollUrl = `${DATACHECKER_BASE_URL}/api/v2/poll`;
    console.log('🌐 Polling URL:', pollUrl);
    console.log('🔑 Using access token:', accessToken ? 'Present' : 'Missing');
    
    const response = await fetch(pollUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Poll request failed:', error);
      return Response.json({ 
        error: 'Failed to poll verification status',
        details: error,
        status: response.status
      }, { status: response.status });
    }

    const responseText = await response.text();
    console.log('📄 Raw response text:', responseText);
    console.log('📄 Response text length:', responseText.length);
    
    const data = responseText ? JSON.parse(responseText) : {};

    console.log('🔍 DataChecker RAW poll response:', JSON.stringify(data, null, 2));
    console.log('🔍 Response type:', typeof data);
    console.log('🔍 Response keys:', Object.keys(data));
    console.log('🔍 Results array:', data.results);
    console.log('🔍 Results length:', data.results?.length);

    // Find the specific transaction in the results array
    const transactionResult = data.results?.find(
      r => r.transactionId === transactionId
    );

    console.log('🔍 Found transaction:', transactionResult ? 'Yes' : 'No');
    console.log('🔍 Transaction result:', transactionResult);

    if (!transactionResult) {
      // Transaction not completed yet
      return Response.json({
        completed: false,
        pending: true,
        results: []
      });
    }

    // Transaction is completed
    return Response.json({
      completed: true,
      pending: false,
      results: [transactionResult],
      rawData: data
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});