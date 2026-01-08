import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getOAuthToken } from './utils/datacheckerAuth.js';

const DATACHECKER_BASE_URL = 'https://developer.staging.datachecker.nl';
const USE_MOCK = Deno.env.get('USE_DATACHECKER_MOCK_API') === 'true';

Deno.serve(async (req) => {
  try {
    // No authentication check - this is called during onboarding before user creation
    const body = await req.json();
    const { transactionId } = body;

    console.log('🔍 Polling request received for transactionId:', transactionId);

    if (!transactionId) {
      return Response.json({ 
        error: 'transactionId is required' 
      }, { status: 400 });
    }

    if (USE_MOCK) {
      // Return mock completed response
      console.log('🎭 Using mock API - returning completed status');
      return Response.json({
        completed: true,
        pending: false,
        results: [{
          resultId: 'mock-result-' + Date.now(),
          transactionId: transactionId,
          product: 'IDV_PREMIUM',
          completed: new Date().toISOString()
        }]
      });
    }

    // Get OAuth token with required scopes
    const accessToken = await getOAuthToken(['productapi.poll.read', 'productapi.result.read']);

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

    console.log('🔍 Looking for transactionId:', transactionId);
    console.log('🔍 Found transaction:', transactionResult ? 'Yes' : 'No');
    console.log('🔍 Transaction result:', JSON.stringify(transactionResult, null, 2));

    if (!transactionResult) {
      // Transaction not completed yet
      console.log('⏳ Transaction not found in results array, returning pending status');
      return Response.json({
        completed: false,
        pending: true,
        results: []
      });
    }

    // Transaction is completed
    console.log('✅ Returning completed status with result:', transactionResult.resultId);
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